/** Idea fields — enforced on API and UI (PostgreSQL uses TEXT; we cap for abuse prevention). */
export const IDEA_TITLE_MAX = 120;
export const IDEA_SHORT_MAX = 280;
export const IDEA_LONG_MAX = 20_000;

/** AI idea generator */
export const AI_PROMPT_MIN = 8;
export const AI_PROMPT_MAX = 2_000;
/** Upper bound for model output before we store or return */
export const AI_LONG_DESC_MAX = 15_000;
/** OpenAI completion budget (rough token cap) */
export const AI_MAX_COMPLETION_TOKENS = 1_200;

/** Community posts */
export const COMMUNITY_POST_MAX = 8_000;

/** “Open to help” note on an idea */
export const IDEA_INTEREST_NOTE_MAX = 500;
