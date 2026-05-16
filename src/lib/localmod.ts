import { matchesExplicitContentPolicy } from "@/lib/content-policy";
import type { IdeaFieldPayload } from "@/lib/validation";

/** toxicity + nsfw: blocks abuse and adult products without prompt_injection spam FPs. */
const DEFAULT_CLASSIFIERS = ["toxicity", "nsfw"] as const;

const BLOCK_SEVERITIES = new Set(["high", "critical"]);

/** Per-classifier minimum confidence before we block (LocalMod may flag lower). */
const CLASSIFIER_BLOCK_CONFIDENCE: Record<string, number> = {
    toxicity: 0.75,
    nsfw: 0.55,
    spam: 0.85,
    prompt_injection: 0.88,
};

export interface LocalModClassifierResult {
    classifier: string;
    flagged: boolean;
    confidence: number;
    severity: string;
}

export interface LocalModAnalyzeResponse {
    flagged: boolean;
    results?: LocalModClassifierResult[];
    processing_time_ms?: number;
}

export type ModerationOutcome =
    | { ok: true }
    | { ok: false; error: string; status: 400 | 503 };

function parseClassifiers(): string[] {
    const raw = process.env.LOCALMOD_CLASSIFIERS?.trim();
    if (!raw) return [...DEFAULT_CLASSIFIERS];
    const list = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return list.length > 0 ? list : [...DEFAULT_CLASSIFIERS];
}

function defaultMinBlockConfidence(): number {
    const n = Number(process.env.LOCALMOD_MIN_CONFIDENCE);
    if (Number.isFinite(n) && n > 0 && n <= 1) return n;
    return 0.75;
}

function config() {
    const url = process.env.LOCALMOD_URL?.trim().replace(/\/$/, "") ?? "";
    const enabled = url.length > 0;
    const failOpen = process.env.LOCALMOD_FAIL_OPEN === "true";
    const timeoutMs = Math.max(
        5_000,
        Number(process.env.LOCALMOD_TIMEOUT_MS) || 120_000
    );
    return {
        url,
        enabled,
        failOpen,
        timeoutMs,
        classifiers: parseClassifiers(),
        defaultMinConfidence: defaultMinBlockConfidence(),
    };
}

function minConfidenceForClassifier(
    classifier: string,
    defaultMin: number
): number {
    return CLASSIFIER_BLOCK_CONFIDENCE[classifier] ?? defaultMin;
}

/** Stricter than LocalMod's per-classifier threshold — reduces false blocks. */
function shouldBlockResult(
    result: LocalModClassifierResult,
    defaultMin: number
): boolean {
    if (!result.flagged) return false;

    const minConfidence = minConfidenceForClassifier(
        result.classifier,
        defaultMin
    );
    const severity = result.severity.toLowerCase();

    if (BLOCK_SEVERITIES.has(severity)) return true;

    // NSFW: also block medium+ when LocalMod flagged it
    if (
        result.classifier === "nsfw" &&
        (severity === "medium" || severity === "high" || severity === "critical")
    ) {
        return true;
    }

    return result.confidence >= minConfidence;
}

function shouldBlockResponse(
    data: LocalModAnalyzeResponse,
    defaultMin: number
): boolean {
    const results = data.results ?? [];
    if (results.length > 0) {
        return results.some((r) => shouldBlockResult(r, defaultMin));
    }
    return data.flagged;
}

function userFacingBlockMessage(details?: string): string {
    if (process.env.NODE_ENV === "development" && details) {
        return `Content did not pass moderation checks (${details}). Please revise and try again.`;
    }
    return "Your submission did not pass our content checks. Please revise and try again.";
}

function serviceUnavailableMessage(): string {
    return "Content moderation is temporarily unavailable. Please try again in a few minutes.";
}

function formatFlagDetails(
    results: LocalModClassifierResult[] | undefined,
    defaultMin: number
): string | undefined {
    const blocked =
        results?.filter((r) => shouldBlockResult(r, defaultMin)) ?? [];
    if (blocked.length === 0) return undefined;
    return blocked
        .map((r) => `${r.classifier} (${Math.round(r.confidence * 100)}%)`)
        .join(", ");
}

function checkContentPolicy(text: string): ModerationOutcome | null {
    if (!matchesExplicitContentPolicy(text)) return null;
    const details =
        process.env.NODE_ENV === "development" ? "explicit content policy" : undefined;
    return {
        ok: false,
        error: userFacingBlockMessage(details),
        status: 400,
    };
}

/**
 * Analyze text with a self-hosted LocalMod instance (`POST /analyze`).
 * When `LOCALMOD_URL` is unset, explicit keyword policy still runs.
 */
export async function moderateText(text: string): Promise<ModerationOutcome> {
    const trimmed = text.trim();
    if (!trimmed) return { ok: true };

    const policyBlock = checkContentPolicy(trimmed);
    if (policyBlock) return policyBlock;

    const { url, enabled, failOpen, timeoutMs, classifiers, defaultMinConfidence } =
        config();
    if (!enabled) return { ok: true };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${url}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed, classifiers }),
            signal: controller.signal,
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            console.error("LocalMod /analyze failed:", res.status, errBody.slice(0, 500));
            if (failOpen) return { ok: true };
            return { ok: false, error: serviceUnavailableMessage(), status: 503 };
        }

        const data = (await res.json()) as LocalModAnalyzeResponse;

        if (
            data.flagged &&
            !shouldBlockResponse(data, defaultMinConfidence) &&
            process.env.NODE_ENV === "development"
        ) {
            console.info(
                "LocalMod flagged below block threshold:",
                formatFlagDetails(data.results, defaultMinConfidence) ?? data.results
            );
        }

        if (shouldBlockResponse(data, defaultMinConfidence)) {
            return {
                ok: false,
                error: userFacingBlockMessage(
                    formatFlagDetails(data.results, defaultMinConfidence)
                ),
                status: 400,
            };
        }

        return { ok: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("LocalMod request error:", message);
        if (failOpen) return { ok: true };
        return { ok: false, error: serviceUnavailableMessage(), status: 503 };
    } finally {
        clearTimeout(timer);
    }
}

export function moderateIdeaFields(fields: IdeaFieldPayload): Promise<ModerationOutcome> {
    const text = [fields.title, fields.shortDesc, fields.longDesc].join("\n\n");
    return moderateText(text);
}

/** Returns true when LocalMod is configured (health checks, ops). */
export function isLocalModEnabled(): boolean {
    return (process.env.LOCALMOD_URL?.trim().length ?? 0) > 0;
}
