"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import MagneticButton from "@/components/animations/MagneticButton";
import TextReveal from "@/components/animations/TextReveal";

/**
 * 404 built as a small 3D diorama: the digits sit on separate Z planes and
 * counter-rotate against the cursor, so the error page still belongs to the
 * same 3D world as the rest of the site.
 */
const DIGITS = ["4", "0", "4"];

const NotFound = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage || prefersReducedMotion()) return;

    let cleanupMove: (() => void) | undefined;

    const ctx = gsap.context(() => {
      const digits = gsap.utils.toArray<HTMLElement>("[data-404-digit]");

      gsap.set(stage, {
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      });

      gsap
        .timeline({ defaults: { ease: "payswapOut" } })
        .from(digits, {
          y: 160,
          z: -700,
          rotateX: -80,
          autoAlpha: 0,
          duration: 1.2,
          stagger: 0.12,
          transformPerspective: 1200,
          force3D: true,
        })
        .from(
          "[data-404-copy] > *",
          { y: 40, autoAlpha: 0, duration: 0.7, stagger: 0.1 },
          "-=0.5"
        );

      // Idle float, each digit on its own phase
      digits.forEach((digit, i) => {
        gsap.to(digit, {
          y: i % 2 === 0 ? -16 : 14,
          rotateZ: i % 2 === 0 ? -3 : 3,
          duration: 2.4 + i * 0.35,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1.1 + i * 0.15,
        });
      });

      // Cursor parallax across the whole stage
      const rotY = gsap.quickTo(stage, "rotateY", {
        duration: 0.7,
        ease: "power3.out",
      });
      const rotX = gsap.quickTo(stage, "rotateX", {
        duration: 0.7,
        ease: "power3.out",
      });

      const handleMove = (e: MouseEvent) => {
        const px = e.clientX / window.innerWidth - 0.5;
        const py = e.clientY / window.innerHeight - 0.5;
        rotY(px * 22);
        rotX(-py * 16);
      };
      window.addEventListener("mousemove", handleMove);
      cleanupMove = () => window.removeEventListener("mousemove", handleMove);
    }, section);

    return () => {
      cleanupMove?.();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden py-32"
    >
      <div className="container mx-auto max-w-screen-xl px-4">
        <div className="flex flex-col items-center text-center">
          <div
            ref={stageRef}
            className="mb-10 flex items-center justify-center gap-2 will-change-transform md:gap-6"
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          >
            {DIGITS.map((digit, i) => (
              <span
                key={i}
                data-404-digit
                className="select-none bg-gradient-to-b from-white via-primary to-secondary bg-clip-text text-[24vw] font-medium leading-none text-transparent drop-shadow-[0_20px_60px_rgba(29,200,205,0.25)] md:text-[16vw]"
              >
                {digit}
              </span>
            ))}
          </div>

          <div data-404-copy className="max-w-xl">
            <TextReveal
              as="h1"
              split="words"
              trigger="mount"
              className="mb-5 text-32 font-medium text-white md:text-48"
            >
              This page drifted off the map
            </TextReveal>
            <p className="mb-10 text-18 text-muted">
              The link may be broken, or the page may have moved. Everything
              else is still exactly where you left it.
            </p>
            <MagneticButton>
              <Link
                href="/"
                className="inline-block rounded-lg border border-primary bg-primary px-8 py-3 text-18 font-medium text-darkmode transition-colors hover:bg-transparent hover:text-primary"
              >
                Back to home
              </Link>
            </MagneticButton>
          </div>
        </div>
      </div>

      <div
        data-speed="0.75"
        className="pointer-events-none absolute -top-32 right-0 -z-1 h-50 w-50 rounded-full bg-gradient-to-tr from-tealGreen from-40% to-charcoalGray to-70% opacity-50 blur-400"
      />
      <div
        data-speed="1.3"
        className="pointer-events-none absolute -bottom-40 -left-20 -z-1 h-50 w-50 rounded-full bg-gradient-to-bl from-tealGreen from-40% to-charcoalGray to-70% opacity-40 blur-400"
      />
    </section>
  );
};

export default NotFound;
