"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollSmoother, prefersReducedMotion } from "@/lib/gsap";

/**
 * Back-to-top control. Pops in with a 3D flip once the page has scrolled, and
 * its ring draws to match overall scroll progress.
 */
export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  const scrollToTop = () => {
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(0, true);
      return;
    }
    if (prefersReducedMotion()) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    gsap.to(window, {
      scrollTo: { y: 0, autoKill: false },
      duration: 0.9,
      ease: "power3.inOut",
    });
  };

  useEffect(() => {
    // Cached: reading scrollHeight inside the scroll handler forces a layout
    // pass on every single scroll event.
    let maxScroll = 1;
    const measure = () => {
      maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    const onScroll = () => {
      const progress = Math.min(1, window.scrollY / maxScroll);
      setIsVisible(window.scrollY > 300);
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(100 - progress * 100);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    const sizeObserver = new ResizeObserver(measure);
    sizeObserver.observe(document.documentElement);
    measure();
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      sizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    // Reduced motion still needs the control to appear — it just appears
    // instantly instead of flipping in.
    if (prefersReducedMotion()) {
      gsap.set(el, {
        autoAlpha: isVisible ? 1 : 0,
        y: 0,
        rotateX: 0,
        scale: 1,
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(el, {
        autoAlpha: isVisible ? 1 : 0,
        y: isVisible ? 0 : 24,
        rotateX: isVisible ? 0 : -70,
        scale: isVisible ? 1 : 0.8,
        duration: 0.55,
        ease: isVisible ? "payswapBack" : "power3.in",
        overwrite: "auto",
      });
    }, el);
    return () => ctx.revert();
  }, [isVisible]);

  return (
    <div
      className="fixed bottom-8 right-8 z-[999]"
      style={{ perspective: "600px" }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={scrollToTop}
        data-cursor-hover
        aria-label="Scroll to top"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-darkmode/80 text-white opacity-0 backdrop-blur-md transition-colors will-change-transform hover:border-primary"
      >
        <svg
          viewBox="0 0 36 36"
          className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
        >
          <circle
            ref={ringRef}
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="#99E39E"
            strokeWidth="1.5"
            strokeDasharray="100"
            strokeDashoffset="100"
            pathLength={100}
          />
        </svg>
        <span className="mt-[3px] block h-3 w-3 rotate-45 border-l-2 border-t-2 border-primary transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
