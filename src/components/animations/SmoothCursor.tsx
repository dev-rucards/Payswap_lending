"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Global interactive cursor: a tight dot that tracks the pointer 1:1 and a
 * lagging ring that eases toward it. The ring scales + goes solid whenever
 * the pointer is over anything tagged [data-cursor-hover]. Desktop
 * (pointer: fine) only — fully inert on touch devices.
 */
const SmoothCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!fine || reduced) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.setAttribute("data-custom-cursor", "");

    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    const handleMove = (e: MouseEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const handleDown = () => {
      gsap.to(ring, { scale: 0.8, duration: 0.25, ease: "power2.out" });
    };
    const handleUp = () => {
      gsap.to(ring, { scale: 1, duration: 0.35, ease: "elastic.out(1, 0.5)" });
    };

    const setHover = (hovering: boolean) => {
      gsap.to(ring, {
        scale: hovering ? 2.2 : 1,
        opacity: hovering ? 0.5 : 1,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(dot, {
        scale: hovering ? 0 : 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    // Delegated hover tracking: works for dynamically mounted elements
    // (menus, modals) without a MutationObserver re-binding listeners.
    let hovered: HTMLElement | null = null;
    const handleOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor-hover]"
      );
      if (target === hovered) return;
      hovered = target ?? null;
      setHover(hovered !== null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);
    document.addEventListener("mouseover", handleOver);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mouseover", handleOver);
      document.documentElement.removeAttribute("data-custom-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[999] hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary [html[data-custom-cursor]_&]:block"
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[998] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/70 [html[data-custom-cursor]_&]:block"
      />
    </>
  );
};

export default SmoothCursor;
