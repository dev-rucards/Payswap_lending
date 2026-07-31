"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ctaContent } from "@/data/payswap";
import { gsap, SplitText } from "@/lib/gsap";
import MagneticButton from "@/components/animations/MagneticButton";

const ContactCta = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([descRef.current, ctasRef.current], { clearProps: "all" });
        return;
      }

      if (titleRef.current) {
        split = new SplitText(titleRef.current, { type: "words" });
      }

      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
        },
      });

      if (split) {
        tl.from(split.words, {
          yPercent: 120,
          rotateX: -75,
          z: -220,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.06,
          transformOrigin: "50% 0%",
          transformPerspective: 900,
          force3D: true,
        });
      }
      if (descRef.current) {
        tl.from(
          descRef.current,
          {
            y: 20,
            z: -160,
            autoAlpha: 0,
            duration: 0.6,
            transformPerspective: 900,
            force3D: true,
          },
          "-=0.4"
        );
      }
      if (ctasRef.current) {
        tl.from(
          ctasRef.current.children,
          {
            y: 16,
            z: -120,
            autoAlpha: 0,
            scale: 0.9,
            duration: 0.55,
            stagger: 0.1,
            ease: "payswapBack",
            transformPerspective: 900,
            force3D: true,
          },
          "-=0.3"
        );
      }

      // The whole block drifts back on Z as it leaves the viewport
      gsap.to(section, {
        z: -180,
        rotateX: 6,
        autoAlpha: 0.35,
        transformPerspective: 1200,
        transformOrigin: "50% 100%",
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: section,
          start: "center center",
          end: "bottom top",
          scrub: 0.7,
        },
      });

      // Ambient blob drifts as the section scrolls through view
      if (blobRef.current) {
        gsap.to(blobRef.current, {
          y: -80,
          x: 40,
          rotate: 25,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    }, section);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id={ctaContent.id}
      className="relative py-28 overflow-hidden z-1"
      style={{ perspective: "1200px" }}
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4 text-center">
        <h2
          ref={titleRef}
          className="text-white lg:text-60 md:text-48 text-36 font-medium mb-6 max-w-3xl mx-auto"
        >
          {ctaContent.title}
        </h2>
        <p
          ref={descRef}
          className="text-muted text-18 mb-10 max-w-2xl mx-auto"
        >
          {ctaContent.description}
        </p>
        <div
          ref={ctasRef}
          className="flex flex-wrap items-center justify-center gap-5"
        >
          <MagneticButton>
            <Link
              href={ctaContent.primaryCta.href}
              className="bg-primary border border-primary rounded-lg text-18 font-medium hover:bg-transparent hover:text-primary text-darkmode py-3 px-8 transition-colors inline-block"
            >
              {ctaContent.primaryCta.label}
            </Link>
          </MagneticButton>
          <MagneticButton>
            <Link
              href={ctaContent.secondaryCta.href}
              className="bg-transparent border border-primary rounded-lg text-18 font-medium hover:bg-primary hover:text-darkmode text-primary py-3 px-8 transition-colors inline-block"
            >
              {ctaContent.secondaryCta.label}
            </Link>
          </MagneticButton>
        </div>
      </div>
      <div
        ref={blobRef}
        className="absolute w-50 h-50 bg-gradient-to-tr from-tealGreen from-40% to-charcoalGray to-70% blur-400 rounded-full -top-32 right-0 -z-1 opacity-50"
      />
    </section>
  );
};

export default ContactCta;
