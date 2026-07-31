"use client";

import { useEffect, useState, type ComponentType } from "react";
import { canRunWebGL } from "@/lib/gsap";

/**
 * Capability-gated loader for the WebGL layer.
 *
 * three.js is ~600KB. Importing WebGLBackground directly would ship all of it
 * on every route — including to phones, reduced-motion users, and devices with
 * no WebGL context, none of which ever render a canvas. So the check runs
 * first and the chunk is only fetched when it will actually be used, after
 * first paint so it never competes with content.
 */
const WebGLBackgroundLazy = () => {
  const [Scene, setScene] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!canRunWebGL()) return;

    let cancelled = false;
    const load = () => {
      import("./WebGLBackground")
        .then((mod) => {
          if (!cancelled) setScene(() => mod.default);
        })
        .catch(() => {
          /* background is decorative — failing to load is not an error */
        });
    };

    // Yield to first paint before pulling in the renderer
    const idle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void) => number;
      }
    ).requestIdleCallback;

    const handle = idle ? idle(load) : window.setTimeout(load, 300);

    return () => {
      cancelled = true;
      if (!idle) window.clearTimeout(handle);
    };
  }, []);

  return Scene ? <Scene /> : null;
};

export default WebGLBackgroundLazy;
