import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

// Central GSAP registration point. Import everything from this file instead of
// "gsap" directly so plugins are registered exactly once, everywhere.
//
// Only register what's actually used — every plugin here is bundled into the
// shared chunk whether or not anything calls it.
if (typeof window !== "undefined") {
  gsap.registerPlugin(
    ScrollTrigger,
    ScrollSmoother,
    ScrollToPlugin,
    SplitText,
    CustomEase
  );

  // Sane, extreme-feeling global defaults.
  ScrollTrigger.defaults({
    toggleActions: "play none none reverse",
  });

  // Signature eases used across the site so motion feels like one system.
  CustomEase.create("payswapOut", "0.16, 1, 0.3, 1"); // expo-ish settle
  CustomEase.create("payswapInOut", "0.87, 0, 0.13, 1"); // heavy swing
  CustomEase.create("payswapBack", "0.34, 1.56, 0.64, 1"); // overshoot pop
}

/** True when the visitor has asked for reduced motion. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True on pointer-fine (desktop-ish) devices where hover effects make sense. */
export const isFinePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: fine)").matches;

/**
 * Rough capability gate for the WebGL layer. Bails on reduced motion, very
 * small screens, and low-core devices so phones don't cook.
 */
export const canRunWebGL = () => {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  if (window.innerWidth < 768) return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 2) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
};

export {
  gsap,
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  SplitText,
  CustomEase,
};
