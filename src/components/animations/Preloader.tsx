"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * First-paint intro: a counter races to 100 while three depth-staggered
 * curtains hold the page, then they peel back in 3D (rotateX + translateZ) to
 * hand off to the hero. Plays once per tab — see SEEN_KEY below.
 */
const SEEN_KEY = "payswap:intro-seen";

/** Once per tab. A 2.3s gate is charming on arrival, tedious on every reload. */
const alreadySeen = () => {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false; // private mode / storage blocked — just play it
  }
};

const markSeen = () => {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* non-fatal */
  }
};

const Preloader = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const finish = () => {
      markSeen();
      document.body.style.overflow = "";
      setDone(true);
    };

    if (prefersReducedMotion() || alreadySeen()) {
      finish();
      return;
    }

    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-intro-panel]");
      const count = { value: 0 };

      const tl = gsap.timeline({ onComplete: finish });

      tl.to(count, {
        value: 100,
        duration: 1.35,
        ease: "power2.inOut",
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = String(Math.round(count.value));
          }
        },
      })
        .to(barRef.current, { scaleX: 1, duration: 1.35, ease: "power2.inOut" }, 0)
        .to(
          "[data-intro-meta]",
          { autoAlpha: 0, y: -18, duration: 0.4, ease: "power3.in" },
          "+=0.1"
        )
        .to(
          panels,
          {
            yPercent: -100,
            rotateX: -22,
            transformOrigin: "top center",
            duration: 0.9,
            stagger: 0.09,
            ease: "payswapInOut",
          },
          "-=0.15"
        );
    }, root);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 z-[9999]"
      style={{ perspective: "1400px" }}
    >
      <div
        data-intro-panel
        className="absolute inset-0 bg-darkmode will-change-transform"
      />
      <div
        data-intro-panel
        className="absolute inset-0 bg-[#04121a] will-change-transform"
      />
      <div
        data-intro-panel
        className="absolute inset-0 bg-[#071c22] will-change-transform"
      />

      <div
        data-intro-meta
        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
      >
        <span className="text-primary text-14 tracking-[0.4em] uppercase">
          Payswap
        </span>
        <div className="flex items-baseline gap-1 text-white">
          <span ref={counterRef} className="text-70 font-medium tabular-nums">
            0
          </span>
          <span className="text-24 text-primary">%</span>
        </div>
        <div className="h-[2px] w-56 overflow-hidden rounded-full bg-white/10">
          <div
            ref={barRef}
            className="h-full w-full origin-left scale-x-0 bg-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default Preloader;
