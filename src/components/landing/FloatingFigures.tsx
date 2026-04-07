"use client";

/**
 * Lightweight animated backdrop (gradient orbs + soft shapes) — inspired by
 * shader-heavy landing pages, implemented with CSS only (no WebGL).
 */
export default function FloatingFigures() {
    return (
        <div
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]"
            aria-hidden
        >
            <div className="nu-figure nu-figure-a absolute -left-[12%] top-[8%] h-48 w-48 rounded-[40%_60%_70%_30%] bg-accent/25 blur-3xl" />
            <div className="nu-figure nu-figure-b absolute -right-[8%] top-[20%] h-56 w-56 rounded-[55%_45%_35%_65%] bg-accent-light/30 blur-3xl" />
            <div className="nu-figure nu-figure-c absolute bottom-[5%] left-[25%] h-40 w-64 rounded-3xl bg-accent/15 blur-2xl" />
            <div className="nu-grid-figures absolute inset-0 opacity-[0.12]" />
        </div>
    );
}
