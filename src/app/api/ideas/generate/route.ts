import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    AI_LONG_DESC_MAX,
    AI_MAX_COMPLETION_TOKENS,
    AI_PROMPT_MAX,
    AI_PROMPT_MIN,
} from "@/lib/limits";

interface GeneratedIdea {
    title: string;
    shortDesc: string;
    longDesc: string;
}

function extractJsonObject(text: string): GeneratedIdea | null {
    try {
        const parsed = JSON.parse(text) as GeneratedIdea;
        if (parsed?.title && parsed?.shortDesc && parsed?.longDesc) return parsed;
    } catch {
        // continue to fallback extraction
    }

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;

    try {
        const parsed = JSON.parse(text.slice(start, end + 1)) as GeneratedIdea;
        if (parsed?.title && parsed?.shortDesc && parsed?.longDesc) return parsed;
    } catch {
        return null;
    }

    return null;
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { prompt } = await req.json();
        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json(
                { error: "Please provide an idea prompt." },
                { status: 400 }
            );
        }

        const trimmed = prompt.trim();
        if (trimmed.length < AI_PROMPT_MIN) {
            return NextResponse.json(
                { error: `Prompt must be at least ${AI_PROMPT_MIN} characters.` },
                { status: 400 }
            );
        }
        if (trimmed.length > AI_PROMPT_MAX) {
            return NextResponse.json(
                { error: `Prompt must be at most ${AI_PROMPT_MAX.toLocaleString()} characters.` },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "AI generation is not configured. Missing OPENAI_API_KEY." },
                { status: 500 }
            );
        }

        const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
        const baseUrl =
            process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                temperature: 0.8,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a product strategist. Generate startup/software idea copy. Return ONLY valid JSON with keys: title, shortDesc, longDesc.",
                    },
                    {
                        role: "user",
                        content: `Prompt: ${trimmed}

Requirements:
- title: max 120 chars, concrete and catchy
- shortDesc: max 220 chars, one-line value proposition
- longDesc: 2-4 short paragraphs explaining problem, solution, target users, and why now
- avoid buzzword spam, be specific
- output strict JSON only`,
                    },
                ],
                max_tokens: AI_MAX_COMPLETION_TOKENS,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return NextResponse.json(
                {
                    error:
                        process.env.NODE_ENV === "development"
                            ? `AI provider error: ${errText}`
                            : "Failed to generate idea with AI",
                },
                { status: 502 }
            );
        }

        const data = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };

        const content = data.choices?.[0]?.message?.content || "";
        const parsed = extractJsonObject(content);
        if (!parsed) {
            return NextResponse.json(
                { error: "AI returned an invalid response format." },
                { status: 502 }
            );
        }

        const longDesc = parsed.longDesc.trim().slice(0, AI_LONG_DESC_MAX);
        return NextResponse.json({
            title: parsed.title.trim().slice(0, 120),
            shortDesc: parsed.shortDesc.trim().slice(0, 280),
            longDesc,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    process.env.NODE_ENV === "development"
                        ? `Failed to generate idea: ${(error as Error).message}`
                        : "Failed to generate idea",
            },
            { status: 500 }
        );
    }
}
