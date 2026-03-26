export interface TrendingIdeaInput {
    id: string;
    title: string;
    shortDesc: string;
    voteCount: number;
    createdAt: Date | string;
}

export interface TrendingIdeaResult {
    idea: TrendingIdeaInput;
    score: number;
}

/**
 * Recency + popularity hybrid score.
 *
 * Formula:
 * trendingScore = (votes + 1) / (ageHours + 2) ^ 1.25
 *
 * - More votes increase score.
 * - Older ideas decay over time (recency).
 * - +1 and +2 smooth cold-start for new ideas.
 */
export function calculateTrendingScore(
    voteCount: number,
    createdAt: Date | string,
    now = new Date()
): number {
    const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
    const ageHours = Math.max(
        0,
        (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    );

    return (voteCount + 1) / Math.pow(ageHours + 2, 1.25);
}

export function pickMostTrendingIdea(
    ideas: TrendingIdeaInput[]
): TrendingIdeaResult | null {
    if (ideas.length === 0) return null;

    let best: TrendingIdeaResult | null = null;
    const now = new Date();

    for (const idea of ideas) {
        const score = calculateTrendingScore(idea.voteCount, idea.createdAt, now);
        if (!best || score > best.score) {
            best = { idea, score };
        }
    }

    return best;
}
