"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";

type TextRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Split granularity. */
  split?: "chars" | "words" | "lines";
  /** Fire on scroll (default) or immediately on mount. */
  trigger?: "scroll" | "mount";
  delay?: number;
  start?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
};

/**
 * SplitText reveal with a 3D rotation on the split units, so headings tumble
 * up into place instead of just fading. Reverts the split on unmount so the
 * DOM (and screen readers) get the original markup back.
 */
const TextReveal = ({
  children,
  className,
  split = "chars",
  trigger = "scroll",
  delay = 0,
  start = "top 85%",
  as = "h2",
}: TextRevealProps) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let instance: SplitText | null = null;

    const ctx = gsap.context(() => {
      instance = new SplitText(el, {
        type: `${split},lines`,
        linesClass: "overflow-hidden inline-block align-bottom",
      });

      const targets =
        split === "chars"
          ? instance.chars
          : split === "words"
            ? instance.words
            : instance.lines;

      gsap.fromTo(
        targets,
        {
          yPercent: 118,
          rotateX: -72,
          autoAlpha: 0,
          transformOrigin: "50% 0%",
          transformPerspective: 800,
        },
        {
          yPercent: 0,
          rotateX: 0,
          autoAlpha: 1,
          duration: 0.95,
          delay,
          ease: "payswapOut",
          stagger: split === "chars" ? 0.018 : 0.06,
          force3D: true,
          ...(trigger === "scroll"
            ? { scrollTrigger: { trigger: el, start } }
            : {}),
        }
      );
    }, el);

    return () => {
      ctx.revert();
      instance?.revert();
    };
  }, [split, trigger, delay, start]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
};

export default TextReveal;
