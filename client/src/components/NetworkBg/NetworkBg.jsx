import React, { useEffect, useRef, useState } from 'react';
import './NetworkBg.css';

// A faint network of dots joined by thin lines, with an occasional dot slowly lighting up.
// Off on phones and touch-first devices; a single still frame when the user prefers reduced motion.
const LINK = 190; // px: dots closer than this get a line
const BLUE = '11,99,246';

const wantsEffect = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? !window.matchMedia('(max-width: 719px)').matches &&
      !window.matchMedia('(pointer: coarse)').matches
    : false;

export default function NetworkBg() {
  const ref = useRef(null);
  const [on, setOn] = useState(wantsEffect);
  useEffect(() => {
    const f = () => setOn(wantsEffect());
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  useEffect(() => {
    if (!on) return;
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0,
      h = 0,
      nodes = [],
      raf = 0,
      last = 0,
      nextGlow = 1200,
      t = 0,
      resizeT = 0;

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(80, Math.round((w * h) / 17000)));
      nodes = Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2,
          v = 6 + Math.random() * 8;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          glow: 0,
          age: -1,
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j],
            d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK) continue;
          const boost = Math.max(a.glow, b.glow);
          ctx.strokeStyle = `rgba(${BLUE},${(0.16 + boost * 0.34) * (1 - d / LINK)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const n of nodes) {
        if (n.glow > 0.01) {
          // soft halo while lit
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 22);
          g.addColorStop(0, `rgba(${BLUE},${0.28 * n.glow})`);
          g.addColorStop(1, `rgba(${BLUE},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 22, 0, 7);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${BLUE},${0.34 + n.glow * 0.56})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.8 + n.glow * 1.6, 0, 7);
        ctx.fill();
      }
    };

    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(now - (last || now), 64);
      last = now;
      t += dt;
      for (const n of nodes) {
        n.x += (n.vx * dt) / 1000;
        n.y += (n.vy * dt) / 1000;
        if (n.x < -20) n.x = w + 20;
        else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        else if (n.y > h + 20) n.y = -20;
        if (n.age >= 0) {
          // ~3.2s: ease up, hold, ease down
          n.age += dt;
          const p = n.age / 3200;
          n.glow = p >= 1 ? 0 : Math.sin(Math.PI * Math.min(p * 1.15, 1)) ** 1.5;
          if (p >= 1) n.age = -1;
        }
      }
      if (t > nextGlow) {
        const n = nodes[(Math.random() * nodes.length) | 0];
        if (n.age < 0) n.age = 0;
        nextGlow = t + 2200 + Math.random() * 2600;
      }
      draw();
    };

    setup();
    if (still) draw();
    else raf = requestAnimationFrame(step);
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        setup();
        if (still) draw();
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeT);
      window.removeEventListener('resize', onResize);
    };
  }, [on]);

  return on ? <canvas ref={ref} className="net-bg" aria-hidden="true" /> : null;
}
