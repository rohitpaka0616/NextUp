"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export default function NeuralOrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const pointer = { x: 0, y: 0 };
    const drift = { x: 0, y: 0 };
    const particleCount = 68;
    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seedParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i += 1) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.8 + 0.6,
        });
      }
    };

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left - w / 2;
      pointer.y = event.clientY - rect.top - h / 2;
    };

    const onLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      drift.x += (pointer.x * 0.025 - drift.x) * 0.04;
      drift.y += (pointer.y * 0.025 - drift.y) * 0.04;

      const cx = w / 2 + drift.x;
      const cy = h / 2 + drift.y;
      const pulse = 0.76 + 0.24 * Math.sin(time * 0.0012);

      const orb = ctx.createRadialGradient(cx, cy, 22, cx, cy, Math.min(w, h) * 0.38);
      orb.addColorStop(0, `rgba(167,139,250,${0.35 * pulse})`);
      orb.addColorStop(0.4, `rgba(99,102,241,${0.24 * pulse})`);
      orb.addColorStop(1, "rgba(17,24,39,0)");
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx + drift.x * 0.0006;
        p.y += p.vy + drift.y * 0.0006;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      ctx.lineWidth = 0.65;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 130) continue;
          const alpha = (1 - dist / 130) * 0.2;
          ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        ctx.beginPath();
        ctx.fillStyle = "rgba(224,231,255,0.85)";
        ctx.shadowColor = "rgba(124,58,237,0.45)";
        ctx.shadowBlur = 10;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };

    const lazyInit = () => {
      resize();
      seedParticles();
      raf = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          lazyInit();
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(canvas);
    window.addEventListener("resize", resize, { passive: true });
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="neural-canvas" aria-hidden />;
}
