"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Route-change reveal. On every pathname change a set of vertical slats snaps
 * in and then wipes away in 3D, so navigating never feels like a hard cut.
 * Skips the very first render — the Preloader owns that moment.
 */
const SLATS = 6;

const RouteTransition = () => {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const slats = gsap.utils.toArray<HTMLElement>("[data-slat]");

      gsap
        .timeline({
          onComplete: () => {
            gsap.set(root, { autoAlpha: 0 });
            ScrollTrigger.refresh();
          },
        })
        .set(root, { autoAlpha: 1 })
        .fromTo(
          slats,
          { yPercent: 100 },
          {
            yPercent: 0,
            duration: 0.42,
            stagger: 0.045,
            ease: "power3.inOut",
          }
        )
        .to(
          slats,
          {
            yPercent: -100,
            rotateY: -12,
            duration: 0.55,
            stagger: 0.045,
            ease: "power3.inOut",
          },
          "+=0.05"
        )
        .set(slats, { yPercent: 100, rotateY: 0 });
    }, root);

    return () => ctx.revert();
  }, [pathname]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9990] flex invisible opacity-0"
      style={{ perspective: "1200px" }}
    >
      {Array.from({ length: SLATS }).map((_, i) => (
        <div
          key={i}
          data-slat
          className="h-full flex-1 translate-y-full bg-darkmode border-r border-white/5 will-change-transform"
        />
      ))}
    </div>
  );
};

export default RouteTransition;
