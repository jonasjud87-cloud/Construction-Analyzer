"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Intro overlay · Phase C. ~520 particles scatter in from random points and
 * lerp onto the outline of a minimal house icon (roof + body + door), then hold
 * with a faint per-particle shimmer. Canvas 2D, DPR-clamped, 30 fps, pauses
 * off-screen / hidden, RAF cancelled on unmount. Palette only: the SA/SB/SC
 * stops are the brand cyan / sky / blue, sampled by vertical position.
 */

const COUNT = 520;
const SA = [79, 209, 255]; // #4fd1ff
const SB = [56, 189, 248]; // #38bdf8
const SC = [40, 98, 215]; // #2862d7
const ASSEMBLE_MS = 1400;

const lp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (s: number) => {
  const x = Math.sin(s) * 43758.5453;
  return x - Math.floor(x);
};

type Seg = { ax: number; ay: number; bx: number; by: number };

function houseSegments(): Seg[] {
  const bodyL = 0.24;
  const bodyR = 0.76;
  const bodyT = 0.46;
  const bodyB = 0.86;
  const eaveL = 0.16;
  const eaveR = 0.84;
  const apexX = 0.5;
  const apexY = 0.14;
  const doorL = 0.44;
  const doorR = 0.56;
  const doorT = 0.62;
  const s = (ax: number, ay: number, bx: number, by: number): Seg => ({ ax, ay, bx, by });
  return [
    s(eaveL, bodyT, apexX, apexY),
    s(apexX, apexY, eaveR, bodyT),
    s(eaveL, bodyT, eaveR, bodyT),
    s(bodyL, bodyT, bodyR, bodyT),
    s(bodyR, bodyT, bodyR, bodyB),
    s(bodyR, bodyB, bodyL, bodyB),
    s(bodyL, bodyB, bodyL, bodyT),
    s(doorL, bodyB, doorL, doorT),
    s(doorL, doorT, doorR, doorT),
    s(doorR, doorT, doorR, bodyB),
  ];
}

function distributeAlong(segs: Seg[], count: number) {
  const lens = segs.map((g) => Math.hypot(g.bx - g.ax, g.by - g.ay));
  const total = lens.reduce((a, b) => a + b, 0);
  const out: { nx: number; ny: number }[] = [];
  for (let i = 0; i < count; i++) {
    let d = ((i + 0.5) / count) * total;
    let si = 0;
    while (si < segs.length - 1 && d > lens[si]) {
      d -= lens[si];
      si += 1;
    }
    const t = lens[si] > 1e-6 ? d / lens[si] : 0;
    const g = segs[si];
    out.push({
      nx: g.ax + (g.bx - g.ax) * t + (rnd(i * 2.13) - 0.5) * 0.006,
      ny: g.ay + (g.by - g.ay) * t + (rnd(i * 7.71) - 0.5) * 0.006,
    });
  }
  return out;
}

export default function IntroHouse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const maxDpr = isMobile ? 0.75 : 1.5;
    const parts = distributeAlong(houseSegments(), COUNT).map((tg, i) => ({
      nx: tg.nx,
      ny: tg.ny,
      x: -0.15 + rnd(i * 1.7) * 1.3,
      y: -0.15 + rnd(i * 3.9) * 1.3,
      sp: 0.6 + rnd(i * 5.2) * 0.9,
      ph: rnd(i * 9.4) * Math.PI * 2,
    }));

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    const colorFor = (ny: number) => {
      const ct = Math.max(0, Math.min(1, ny));
      const from = ct < 0.5 ? SA : SB;
      const to = ct < 0.5 ? SB : SC;
      const lct = ct < 0.5 ? ct / 0.5 : (ct - 0.5) / 0.5;
      return [
        Math.min(255, Math.round(lp(from[0], to[0], lct)) + 25),
        Math.min(255, Math.round(lp(from[1], to[1], lct)) + 25),
        Math.min(255, Math.round(lp(from[2], to[2], lct)) + 25),
      ];
    };

    const draw = (elapsed: number) => {
      const S = Math.min(w, h);
      const ox = (w - S) / 2;
      const oy = (h - S) / 2;
      const conv = Math.min(1, elapsed / ASSEMBLE_MS);
      const settled = elapsed >= ASSEMBLE_MS;
      const ease = 0.06 + 0.03 * conv;
      const dot = Math.max(1, (isMobile ? 1.4 : 1.7) * (S / 460));
      const t = elapsed / 1000;

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i += 1) {
        const p = parts[i];
        p.x += (p.nx - p.x) * ease;
        p.y += (p.ny - p.y) * ease;
        let dx = p.x;
        let dy = p.y;
        if (settled) {
          dx += Math.sin(t * p.sp + p.ph) * 0.0016;
          dy += Math.cos(t * p.sp * 0.9 + p.ph) * 0.0016;
        }
        const sx = ox + dx * S;
        const sy = oy + dy * S;
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
        const shim = settled
          ? 0.72 + 0.28 * Math.sin(t * (1.6 + p.sp) + p.ph)
          : 0.32 + 0.5 * conv;
        const [r, g, b] = colorFor(p.ny);
        ctx.fillStyle = `rgba(${r},${g},${b},${shim.toFixed(2)})`;
        ctx.fillRect(sx - dot, sy - dot, dot * 2, dot * 2);
      }
    };

    if (prefersReduced) {
      for (const p of parts) {
        p.x = p.nx;
        p.y = p.ny;
      }
      draw(ASSEMBLE_MS + 400);
      return () => window.removeEventListener("resize", resize);
    }

    let raf = 0;
    let visible = true;
    let last = performance.now();
    let acc = 0;
    const FRAME_MS = 1000 / 30;
    const start = performance.now();

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(canvas);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      acc += now - last;
      last = now;
      if (acc < FRAME_MS) return;
      acc = 0;
      draw(now - start);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [prefersReduced]);

  return (
    <div className="tb-intro__house" aria-hidden="true">
      <canvas ref={canvasRef} className="tb-intro__house-canvas" />
    </div>
  );
}
