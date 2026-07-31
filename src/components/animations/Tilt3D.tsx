"use client";

import { useEffect, useRef } from "react";
import { gsap, isFinePointer, prefersReducedMotion } from "@/lib/gsap";

type Tilt3DProps = {
  children: React.ReactNode;
  className?: string;
  /** Max rotation in degrees at the edges of the element. */
  max?: number;
  /** How far the content pops toward the viewer on hover, in px. */
  lift?: number;
  /** Adds a moving specular sheen across the surface. */
  glare?: boolean;
};

/**
 * Cursor-driven 3D tilt for cards, images, and panels. Rotation is eased with
 * quickTo so it tracks the pointer without a tween per mousemove, and the
 * element springs back on leave.
 */
const Tilt3D = ({
  children,
  className,
  max = 14,
  lift = 26,
  glare = true,
}: Tilt3DProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    if (!isFinePointer() || prefersReducedMotion()) return;

    gsap.set(inner, {
      transformPerspective: 1100,
      transformStyle: "preserve-3d",
    });

    const rotX = gsap.quickTo(inner, "rotateX", {
      duration: 0.5,
      ease: "power3.out",
    });
    const rotY = gsap.quickTo(inner, "rotateY", {
      duration: 0.5,
      ease: "power3.out",
    });
    const moveZ = gsap.quickTo(inner, "z", {
      duration: 0.5,
      ease: "power3.out",
    });

    const handleMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotY(px * max * 2);
      rotX(-py * max * 2);
      moveZ(lift);
      if (glareRef.current) {
        gsap.to(glareRef.current, {
          opacity: 0.32,
          backgroundPosition: `${(px + 0.5) * 100}% ${(py + 0.5) * 100}%`,
          duration: 0.4,
          overwrite: "auto",
        });
      }
    };

    const handleLeave = () => {
      gsap.to(inner, {
        rotateX: 0,
        rotateY: 0,
        z: 0,
        duration: 0.9,
        ease: "elastic.out(1, 0.55)",
        overwrite: "auto",
      });
      if (glareRef.current) {
        gsap.to(glareRef.current, {
          opacity: 0,
          duration: 0.5,
          overwrite: "auto",
        });
      }
    };

    wrap.addEventListener("mousemove", handleMove);
    wrap.addEventListener("mouseleave", handleLeave);
    return () => {
      wrap.removeEventListener("mousemove", handleMove);
      wrap.removeEventListener("mouseleave", handleLeave);
    };
  }, [max, lift, glare]);

  return (
    <div
      ref={wrapRef}
      data-cursor-hover
      className={className}
      style={{ perspective: "1100px" }}
    >
      <div
        ref={innerRef}
        className="relative h-full w-full will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
        {glare && (
          <div
            ref={glareRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-overlay"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.85), rgba(255,255,255,0) 55%)",
              backgroundSize: "220% 220%",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Tilt3D;
