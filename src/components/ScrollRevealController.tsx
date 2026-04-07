"use client";

import { useEffect } from "react";

const COUNTER_EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

export default function ScrollRevealController() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const sections = Array.from(document.querySelectorAll("main section"));
    const observedElements: HTMLElement[] = [];

    sections.forEach((section) => {
      const sectionEl = section as HTMLElement;
      const children = Array.from(sectionEl.children) as HTMLElement[];
      children.forEach((child, idx) => {
        child.classList.add("reveal-init");
        child.style.setProperty("--reveal-delay", `${idx * 80}ms`);
        observedElements.push(child);
      });
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add("reveal-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    observedElements.forEach((el) => revealObserver.observe(el));

    const magneticButtons = Array.from(
      document.querySelectorAll(".magnetic-btn, .btn-primary, .btn-secondary")
    ) as HTMLElement[];
    const magneticCleanup: Array<() => void> = [];

    magneticButtons.forEach((button) => {
      const onMove = (event: MouseEvent) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        button.style.setProperty("--mag-x", `${x * 8}px`);
        button.style.setProperty("--mag-y", `${y * 8}px`);
      };

      const onLeave = () => {
        button.style.setProperty("--mag-x", "0px");
        button.style.setProperty("--mag-y", "0px");
      };

      button.addEventListener("mousemove", onMove);
      button.addEventListener("mouseleave", onLeave);
      magneticCleanup.push(() => {
        button.removeEventListener("mousemove", onMove);
        button.removeEventListener("mouseleave", onLeave);
      });
    });

    const counters = Array.from(document.querySelectorAll("[data-counter-target]")) as HTMLElement[];
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const node = entry.target as HTMLElement;
          const target = Number(node.dataset.counterTarget ?? "0");
          const duration = Number(node.dataset.counterDuration ?? "1200");
          const prefix = node.dataset.counterPrefix ?? "";
          const suffix = node.dataset.counterSuffix ?? "";
          const start = performance.now();

          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = COUNTER_EASE_OUT_CUBIC(progress);
            const value = Math.round(target * eased);
            node.textContent = `${prefix}${value}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
          counterObserver.unobserve(node);
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach((counter) => {
      counter.textContent = `${counter.dataset.counterPrefix ?? ""}0${counter.dataset.counterSuffix ?? ""}`;
      counterObserver.observe(counter);
    });

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
      magneticCleanup.forEach((fn) => fn());
    };
  }, []);

  return null;
}
