"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  gsap,
  ScrollSmoother,
  ScrollTrigger,
  prefersReducedMotion,
} from "@/lib/gsap";

/**
 * ScrollSmoother wrapper. Everything that should scroll lives inside
 * #smooth-content; fixed chrome (header, cursor, WebGL canvas, scroll-to-top)
 * must stay OUTSIDE this component or ScrollSmoother's transform will drag it
 * along with the page.
 *
 * Also enables `effects: true`, which turns `data-speed` and `data-lag`
 * attributes anywhere in the tree into parallax — that's what most of the
 * per-section depth is built on.
 */
const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const smootherRef = useRef<ScrollSmoother | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      smootherRef.current = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.15,
        effects: true,
        smoothTouch: false, // native momentum on touch devices
        normalizeScroll: false,
        ignoreMobileResize: true,
      });
    });

    return () => {
      ctx.revert();
      smootherRef.current = null;
    };
  }, []);

  /**
   * ScrollTrigger measures pin start/end from the layout as it exists at
   * creation time. Images, web fonts and late-mounting content all change
   * document height afterwards, which silently desyncs the pinned product
   * stage. Re-measure whenever that happens.
   */
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();

    // Debounced so a burst of image loads costs one refresh, not twenty
    let pending = 0;
    const scheduleRefresh = () => {
      window.clearTimeout(pending);
      pending = window.setTimeout(refresh, 150);
    };

    window.addEventListener("load", refresh);

    // Fonts change text metrics, which changes section heights
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(scheduleRefresh).catch(() => {});
    }

    // Any image that finishes decoding after hydration
    const images = Array.from(document.images);
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", scheduleRefresh);
    });

    // NOTE: deliberately no ResizeObserver on <body>. ScrollTrigger.refresh()
    // rebuilds pin spacers, which changes body height, which would re-trigger
    // the observer — an endless refresh loop that resets every pinned
    // animation a few times a second. ScrollTrigger already refreshes itself
    // on viewport resize, so this would buy nothing anyway.

    return () => {
      window.clearTimeout(pending);
      window.removeEventListener("load", refresh);
      images.forEach((img) => img.removeEventListener("load", scheduleRefresh));
    };
  }, []);

  // App Router swaps content without a full reload — measurements go stale.
  useEffect(() => {
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh();
      smootherRef.current?.scrollTo(0, false);
    }, 60);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">{children}</div>
    </div>
  );
};

export default SmoothScroll;
