/**
 * Registration and profile validation.
 * Server routes must re-validate — never trust the client alone.
 */

import {
    IDEA_LONG_MAX,
    IDEA_SHORT_MAX,
    IDEA_TITLE_MAX,
} from "@/lib/limits";

const EMAIL_RE =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** RFC-inspired practical check; avoids obviously invalid addresses. */
export function isValidEmail(email: string): boolean {
    const e = normalizeEmail(email);
    if (e.length < 5 || e.length > 254) return false;
    if (!EMAIL_RE.test(e)) return false;
    const parts = e.split("@");
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local.length || local.length > 64) return false;
    if (!domain.includes(".")) return false;
    return true;
}

/**
 * Display name: 2–80 chars, at least one Unicode letter (allows most real names).
 */
export function isValidDisplayName(name: string): boolean {
    const n = name.trim();
    if (n.length < 2 || n.length > 80) return false;
    if (!/\p{L}/u.test(n)) return false;
    return true;
}

export interface IdeaFieldPayload {
    title: string;
    shortDesc: string;
    longDesc: string;
}

export function trimIdeaFields(raw: {
    title?: unknown;
    shortDesc?: unknown;
    longDesc?: unknown;
}): IdeaFieldPayload | null {
    if (
        typeof raw.title !== "string" ||
        typeof raw.shortDesc !== "string" ||
        typeof raw.longDesc !== "string"
    ) {
        return null;
    }
    return {
        title: raw.title.trim(),
        shortDesc: raw.shortDesc.trim(),
        longDesc: raw.longDesc.trim(),
    };
}

/** Returns an error message or null if valid. */
export function validateIdeaContent(fields: IdeaFieldPayload): string | null {
    if (!fields.title || !fields.shortDesc || !fields.longDesc) {
        return "Title, short description, and long description are required";
    }
    if (fields.title.length > IDEA_TITLE_MAX) {
        return `Title must be at most ${IDEA_TITLE_MAX} characters`;
    }
    if (fields.shortDesc.length > IDEA_SHORT_MAX) {
        return `Short description must be at most ${IDEA_SHORT_MAX} characters`;
    }
    if (fields.longDesc.length > IDEA_LONG_MAX) {
        return `Full description must be at most ${IDEA_LONG_MAX.toLocaleString()} characters`;
    }
    return null;
}
