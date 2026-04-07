"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollTypewriterProps {
    phrases: string[];
    className?: string;
}

export default function ScrollTypewriter({ phrases, className = "" }: ScrollTypewriterProps) {
    const [text, setText] = useState("");
    const [started, setStarted] = useState(false);
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) setStarted(true);
            },
            { rootMargin: "0px 0px -15% 0px", threshold: 0.2 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!started || phrases.length === 0) return;
        let cancelled = false;
        let phraseIdx = 0;

        const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

        const run = async () => {
            while (!cancelled) {
                const phrase = phrases[phraseIdx % phrases.length] ?? "";
                setText("");
                for (let i = 0; i <= phrase.length; i++) {
                    if (cancelled) return;
                    setText(phrase.slice(0, i));
                    await sleep(38);
                }
                await sleep(2000);
                phraseIdx += 1;
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [started, phrases]);

    return (
        <span ref={containerRef} className={className}>
            {text}
            {started ? (
                <span className="ml-0.5 inline-block h-[1em] w-px animate-pulse bg-muted align-[-0.15em]" />
            ) : null}
        </span>
    );
}
