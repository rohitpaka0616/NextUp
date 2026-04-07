"use client";

interface ScrollingMarqueeProps {
    items: string[];
    direction?: "left" | "right";
    className?: string;
    /** Slower = larger seconds */
    durationSec?: number;
}

export default function ScrollingMarquee({
    items,
    direction = "left",
    className = "",
    durationSec = 45,
}: ScrollingMarqueeProps) {
    const line = items.join(" · ") + " · ";
    const repeated = `${line}${line}${line}`;

    return (
        <div
            className={`nu-marquee-shell border-y border-border/60 bg-card/40 py-2 backdrop-blur-sm ${className}`}
            aria-hidden
        >
            <div
                className="flex w-max nu-marquee-track"
                style={{
                    animationDuration: `${durationSec}s`,
                    animationDirection: direction === "left" ? "normal" : "reverse",
                }}
            >
                <span className="shrink-0 px-3 font-display text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {repeated}
                </span>
                <span className="shrink-0 px-3 font-display text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {repeated}
                </span>
            </div>
        </div>
    );
}
