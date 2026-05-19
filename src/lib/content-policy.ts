/**
 * Fast, local rules for obvious policy violations (runs before LocalMod).
 * ML often misses “professional” wording for harassment or adult products.
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

/** Harassment, deportation-enabling tools, targeting people by personal name. */
const HARASSMENT_PATTERNS: RegExp[] = [
    /\bdeportation\s+finder\b/i,
    /\b(?:find|identify|locate|track|round\s*up).{0,56}\bdeport(?:ation|ing)?\b/i,
    /\bdeport(?:ation|ing)?\b.{0,56}\b(?:find|identify|locate|track|finder)\b/i,
    /\b(?:individuals?|people|persons?)\s+named\s+[A-Za-z]+.{0,96}\b(?:deport|stateless|citizenship\s+documentation|lack\s+(?:of\s+)?(?:citizenship|documentation))\b/i,
    /\b(?:identify|find|locate).{0,56}\bnamed\s+[A-Za-z]+.{0,56}\b(?:deport|stateless|undocumented)\b/i,
    /\bround\s*up\b.{0,48}\b(?:immigrants?|migrants?|refugees?|foreigners?|illegals?)\b/i,
];

export function matchesExplicitContentPolicy(text: string): boolean {
    return EXPLICIT_PATTERNS.some((pattern) => pattern.test(text));
}

export function matchesHarassmentPolicy(text: string): boolean {
    return HARASSMENT_PATTERNS.some((pattern) => pattern.test(text));
}

export function violatesContentPolicy(text: string): boolean {
    const normalized = text.trim();
    if (!normalized) return false;
    return (
        matchesExplicitContentPolicy(normalized) ||
        matchesHarassmentPolicy(normalized)
    );
}
