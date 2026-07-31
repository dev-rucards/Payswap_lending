"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  strength?: number;
};

/**
 * Wraps interactive elements (links/buttons) with a magnetic pull effect:
 * the child drifts toward the cursor within its bounds and snaps back with
 * an elastic ease on leave. Pointer-fine devices only — no-ops on touch.
 */
const MagneticButton = ({
  children,
  className,
  strength = 0.4,
}: MagneticButtonProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!fine || reduced) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo(relX * strength);
      yTo(relY * strength);
    };

    const handleLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)",
      });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength]);

  return (
    <div
      ref={wrapRef}
      data-cursor-hover
      className={`inline-block will-change-transform ${className ?? ""}`}
    >
      {children}
    </div>
  );
};

export default MagneticButton;
