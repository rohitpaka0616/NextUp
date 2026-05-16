/**
 * Fast, local rules for obvious policy violations (runs before LocalMod).
 * Catches clear adult/explicit product ideas that ML may miss or score below threshold.
 */

const EXPLICIT_PATTERNS: RegExp[] = [
    /\bporn(?:ography)?\b/i,
    /\bxxx\b/i,
    /\bhentai\b/i,
    /\bnudes?\b/i,
    /\bonlyfans\b/i,
    /\bsex\s*chat\b/i,
    /\berotic\b/i,
    /\bfetish\b/i,
    /\borgasm\b/i,
    /\bescort\s+service\b/i,
    /\badult\s+(?:only\s+)?(?:chat|site|app|platform|content|video)\b/i,
    /\b(?:nsfw|18\+)\s+(?:chat|app|site|bot)\b/i,
    /\b(?:ai|artificial intelligence).{0,48}\b(?:porn|xxx|nsfw|sex\s*chat|nudes?|erotic)\b/i,
    /\b(?:porn|xxx|nsfw|sex\s*chat|nudes?|erotic).{0,48}\b(?:ai|chat\s*bot|chatbot)\b/i,
];

export function matchesExplicitContentPolicy(text: string): boolean {
    const normalized = text.trim();
    if (!normalized) return false;
    return EXPLICIT_PATTERNS.some((pattern) => pattern.test(normalized));
}
