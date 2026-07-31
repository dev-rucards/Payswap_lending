"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getImagePrefix } from "@/utils/utils";
import { heroContent } from "@/data/payswap";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import MagneticButton from "@/components/animations/MagneticButton";

const CARD_IMAGES = [
  { src: "images/hero/card-payswap.svg", alt: "Payswap card", label: "Payswap" },
  { src: "images/hero/card-amazon.svg", alt: "Amazon voucher card", label: "Amazon" },
  { src: "images/hero/card-flipkart.svg", alt: "Flipkart voucher card", label: "Flipkart" },
  { src: "images/hero/card-myntra.svg", alt: "Myntra voucher card", label: "Myntra" },
  { src: "images/hero/card-nykaa.svg", alt: "Nykaa voucher card", label: "Nykaa" },
  { src: "images/hero/card-ajio.svg", alt: "Ajio voucher card", label: "Ajio" },
  { src: "images/hero/card-swiggy.svg", alt: "Swiggy voucher card", label: "Swiggy" },
] as const;

const SWAP_MS = 2500;

const Hero = () => {
  const [cardIndex, setCardIndex] = useState(0);
  const prefix = getImagePrefix();

  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const cardStackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLImageElement | null)[]>([]);
  const prevIndexRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCardIndex((prev) => (prev + 1) % CARD_IMAGES.length);
    }, SWAP_MS);
    return () => window.clearInterval(id);
  }, []);

  // Card swap. The card is held between the hand layers, so it must never
  // rotate or translate out of the hand's plane — doing that exposes the
  // fingers behind it and breaks the illusion. Instead the outgoing card
  // dissolves straight back while the incoming one settles forward in place:
  // depth comes from scale + opacity only, no rotation, no X/Y travel.
  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = cardIndex;
    if (prev === cardIndex) return;

    const outgoing = cardRefs.current[prev];
    const incoming = cardRefs.current[cardIndex];
    if (!incoming) return;

    if (prefersReducedMotion()) {
      if (outgoing) gsap.set(outgoing, { autoAlpha: 0 });
      gsap.set(incoming, { autoAlpha: 1, scale: 1 });
      return;
    }

    const tl = gsap.timeline();

    if (outgoing) {
      tl.to(
        outgoing,
        {
          autoAlpha: 0,
          scale: 0.965,
          duration: 0.45,
          ease: "power2.inOut",
          overwrite: "auto",
        },
        0
      );
    }

    tl.fromTo(
      incoming,
      { autoAlpha: 0, scale: 1.035 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.55,
        ease: "power2.out",
        overwrite: "auto",
      },
      0.12
    );

    return () => {
      tl.kill();
    };
  }, [cardIndex]);

  // Entrance timeline: eyebrow -> split-text title -> description -> CTAs -> chips
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(
          [
            eyebrowRef.current,
            descRef.current,
            ctasRef.current,
            chipsRef.current,
            mockupRef.current,
          ],
          { clearProps: "all" }
        );
        return;
      }

      if (titleRef.current) {
        split = new SplitText(titleRef.current, {
          type: "chars,words",
          charsClass: "will-change-transform",
        });
      }

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      if (eyebrowRef.current) {
        tl.from(eyebrowRef.current, { y: -24, autoAlpha: 0, duration: 0.6 }, 0);
      }
      if (split) {
        tl.from(
          split.chars,
          {
            yPercent: 130,
            rotateZ: 6,
            autoAlpha: 0,
            duration: 0.9,
            stagger: 0.015,
            ease: "power4.out",
          },
          0.15
        );
      }
      if (descRef.current) {
        tl.from(descRef.current, { y: 24, autoAlpha: 0, duration: 0.7 }, 0.55);
      }
      if (ctasRef.current) {
        tl.from(
          ctasRef.current.children,
          {
            y: 20,
            autoAlpha: 0,
            scale: 0.9,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.8)",
          },
          0.7
        );
      }
      if (chipsRef.current) {
        tl.from(
          chipsRef.current.children,
          { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.06 },
          0.85
        );
      }
      if (mockupRef.current) {
        tl.from(
          mockupRef.current,
          {
            x: 60,
            autoAlpha: 0,
            scale: 0.92,
            duration: 1,
            ease: "power3.out",
          },
          0.25
        );
      }
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  // Idle levitation + cursor-parallax tilt on the card mockup
  useEffect(() => {
    const stack = cardStackRef.current;
    const section = sectionRef.current;
    if (!stack || !section) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced) return;

    // The float lives on the innermost element, NOT on mockupRef. The
    // scroll-exit timeline also animates `y`, and an infinite yoyo tween and a
    // scrubbed tween writing the same property on the same element overwrite
    // each other every frame — that's what made the hand stutter and stick.
    // Each layer now owns its own properties:
    //   mockupRef   → entrance (x, scale, autoAlpha)
    //   depthRef    → scroll exit (y, z, autoAlpha)
    //   cardStackRef → idle float (y) + cursor tilt (rotateX/rotateY)
    const float = gsap.to(stack, {
      y: -16,
      duration: 2.6,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    // Bake a per-element perspective so rotateX/rotateY read as true 3D tilt.
    // x:12 replaces the old `translate-x-3` class — GSAP owns this element's
    // transform now, so the offset has to come from GSAP or it gets clobbered.
    gsap.set(stack, {
      x: 12,
      transformPerspective: 1200,
      transformOrigin: "center",
    });

    const rotateX = gsap.quickTo(stack, "rotateX", {
      duration: 0.6,
      ease: "power3.out",
    });
    const rotateY = gsap.quickTo(stack, "rotateY", {
      duration: 0.6,
      ease: "power3.out",
    });

    const handleMove = (e: MouseEvent) => {
      if (!fine) return;
      const rect = section.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotateY(px * 16);
      rotateX(-py * 16);
    };

    const handleLeave = () => {
      gsap.to(stack, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "power3.out" });
    };

    section.addEventListener("mousemove", handleMove);
    section.addEventListener("mouseleave", handleLeave);

    return () => {
      float.kill();
      section.removeEventListener("mousemove", handleMove);
      section.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  // Scroll-driven depth exit: the hero recedes into the page instead of
  // sliding off it, so the product stage feels like it comes forward.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      tl.to(
        [eyebrowRef.current, titleRef.current, descRef.current],
        {
          z: -420,
          y: -60,
          rotateX: 14,
          autoAlpha: 0,
          transformPerspective: 1000,
          transformOrigin: "50% 100%",
          ease: "none",
          force3D: true,
        },
        0
      );

      tl.to(
        [ctasRef.current, chipsRef.current],
        {
          z: -280,
          y: -30,
          autoAlpha: 0,
          transformPerspective: 1000,
          ease: "none",
          force3D: true,
        },
        0.05
      );

      // Targets depthRef, not mockupRef — mockupRef is owned by the entrance
      // tween. No rotation either: the hand is a flat illustration, so tilting
      // it reads as a cardboard cutout. Depth only.
      tl.to(
        depthRef.current,
        {
          z: -260,
          y: 40,
          autoAlpha: 0.15,
          transformPerspective: 1200,
          ease: "none",
          force3D: true,
        },
        0
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const active = CARD_IMAGES[cardIndex];

  return (
    <section
      ref={sectionRef}
      className="relative md:pt-40 md:pb-28 py-20 overflow-hidden z-1"
      id="main-banner"
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4">
        <div className="grid grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-5 col-span-12">
            <div
              ref={eyebrowRef}
              className="flex gap-6 items-center lg:justify-start justify-center mb-5 mt-24"
            >
              <Image
                src={`${prefix}images/icons/icon-bag.svg`}
                alt="icon"
                width={40}
                height={40}
              />
              <p className="text-white sm:text-28 text-18 mb-0">
                {heroContent.eyebrow}{" "}
                <span className="text-primary">on the go</span>
              </p>
            </div>
            <h1
              ref={titleRef}
              className="font-medium lg:text-70 md:text-55 text-40 lg:text-start text-center text-white mb-6 leading-tight"
            >
              {heroContent.titleBefore}{" "}
              <span className="text-primary">{heroContent.titleHighlight}</span>{" "}
              {heroContent.titleAfter}
            </h1>
            <p
              ref={descRef}
              className="text-muted text-18 lg:text-start text-center mb-10 max-w-lg lg:mx-0 mx-auto"
            >
              {heroContent.description}
            </p>
            <div
              ref={ctasRef}
              className="flex flex-wrap items-center md:justify-start justify-center gap-5"
            >
              <MagneticButton>
                <Link
                  href={heroContent.primaryCta.href}
                  className="bg-primary border border-primary rounded-lg text-21 font-medium hover:bg-transparent hover:text-primary text-darkmode py-2 px-7 z-50 transition-colors inline-block"
                >
                  {heroContent.primaryCta.label}
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href={heroContent.secondaryCta.href}
                  className="bg-transparent border border-primary rounded-lg text-21 font-medium hover:bg-primary hover:text-darkmode text-primary py-2 px-7 transition-colors inline-block"
                >
                  {heroContent.secondaryCta.label}
                </Link>
              </MagneticButton>
            </div>
            <div
              ref={chipsRef}
              className="flex flex-wrap items-center md:justify-start justify-center gap-3 mt-14"
            >
              {heroContent.chips.map((chip) => (
                <span
                  key={chip}
                  className="text-white/80 text-14 border border-white/15 rounded-full px-4 py-2 bg-white/5"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div
            ref={mockupRef}
            className="col-span-7 lg:block hidden relative min-h-[560px]"
          >
            <div
              ref={depthRef}
              className="absolute inset-0 flex items-end justify-end will-change-transform"
            >
              <div
                ref={cardStackRef}
                className="relative h-full aspect-[416/847] will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Hand under card */}
                <img
                  src={`${prefix}images/hero/hand-base.svg`}
                  alt=""
                  className="absolute inset-0 z-[1] h-full w-full object-contain select-none pointer-events-none"
                  draggable={false}
                  aria-hidden
                />

                {/* All brand cards stacked — cross-dissolved in place */}
                {CARD_IMAGES.map((card, index) => (
                  <img
                    key={card.src}
                    ref={(node) => {
                      cardRefs.current[index] = node;
                    }}
                    src={`${prefix}${card.src}`}
                    alt={card.alt}
                    className="absolute inset-0 z-[2] h-full w-full select-none object-contain will-change-transform pointer-events-none"
                    draggable={false}
                    style={{
                      opacity: index === 0 ? 1 : 0,
                      visibility: index === 0 ? "visible" : "hidden",
                      // Deliberately flat: the card sits between hand-base and
                      // hand-top, so any 3D rotation would clip through the
                      // fingers. Keep it in the hand's plane.
                      transformStyle: "flat",
                      transformOrigin: "50% 50%",
                    }}
                  />
                ))}

                {/* Fingers over card */}
                <img
                  src={`${prefix}images/hero/hand-top.svg`}
                  alt=""
                  className="absolute inset-0 z-[3] h-full w-full object-contain select-none pointer-events-none"
                  draggable={false}
                  aria-hidden
                />

                {/* Active brand pill — proves swap is running */}
                <div className="absolute bottom-8 left-1/2 z-[4] -translate-x-1/2 rounded-full border border-white/20 bg-darkmode/80 px-4 py-1.5 text-14 text-white backdrop-blur-sm">
                  {active.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        data-speed="0.7"
        className="absolute w-50 h-50 bg-gradient-to-bl from-tealGreen from-50% to-charcoalGray to-60% blur-400 rounded-full -top-64 -right-14 -z-1"
      />
      <div
        data-speed="1.35"
        className="pointer-events-none absolute -bottom-40 left-1/4 w-40 h-40 rounded-full bg-gradient-to-tr from-secondary/30 to-transparent blur-400 -z-1"
      />
    </section>
  );
};

export default Hero;
