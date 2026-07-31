"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Which way the block swings in from, in 3D. */
  from?: "bottom" | "left" | "right" | "flip" | "zoom";
  /** Seconds of delay after the trigger fires. */
  delay?: number;
  /** Stagger direct children instead of animating the wrapper as one block. */
  stagger?: number;
  /** ScrollTrigger start position. */
  start?: string;
  /** Render as a different element (default div). */
  as?: "div" | "section" | "li" | "article";
};

const VARIANTS: Record<
  NonNullable<RevealProps["from"]>,
  gsap.TweenVars
> = {
  bottom: { y: 70, rotateX: -24, autoAlpha: 0, transformOrigin: "50% 100%" },
  left: { x: -80, rotateY: 28, autoAlpha: 0, transformOrigin: "0% 50%" },
  right: { x: 80, rotateY: -28, autoAlpha: 0, transformOrigin: "100% 50%" },
  flip: { rotateX: 78, y: 40, autoAlpha: 0, transformOrigin: "50% 0%" },
  zoom: { scale: 0.82, z: -220, autoAlpha: 0 },
};

/**
 * Scroll-triggered 3D entrance for any block of content. Everything gets a
 * baked perspective so rotateX/rotateY read as real depth rather than a skew.
 */
const Reveal = ({
  children,
  className,
  from = "bottom",
  delay = 0,
  stagger,
  start = "top 82%",
  as = "div",
}: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { clearProps: "all" });
      return;
    }

    const targets =
      stagger != null ? (Array.from(el.children) as HTMLElement[]) : el;
    if (Array.isArray(targets) && targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { ...VARIANTS[from], transformPerspective: 1000 },
        {
          x: 0,
          y: 0,
          z: 0,
          scale: 1,
          rotateX: 0,
          rotateY: 0,
          autoAlpha: 1,
          duration: 1,
          delay,
          stagger: stagger ?? 0,
          ease: "payswapOut",
          transformPerspective: 1000,
          force3D: true,
          scrollTrigger: { trigger: el, start },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [from, delay, stagger, start]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={className} style={{ perspective: "1000px" }}>
      {children}
    </Tag>
  );
};

export default Reveal;
