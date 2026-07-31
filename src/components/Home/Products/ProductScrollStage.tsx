"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, ScrollSmoother } from "@/lib/gsap";
import ProductScene from "./ProductScene";
import { productSections } from "@/data/payswap";

const SCENE_IDS = productSections.map((s) => s.id);

const ProductScrollStage = () => {
  const stageRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const scrollToSceneRef = useRef<(id: string) => void>(() => {});

  useEffect(() => {
    const stage = stageRef.current;
    const pin = pinRef.current;
    if (!stage || !pin) return;

    const mobileMq = window.matchMedia("(max-width: 1023px)");
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let ctx: gsap.Context | null = null;

    const scrollToScene = (id: string) => {
      const st = stRef.current;
      if (!st) return;
      const index = SCENE_IDS.indexOf(id as (typeof SCENE_IDS)[number]);
      if (index < 0) return;
      // Land mid-hold of each scene (after enter, before exit)
      const progress = (index + 0.35) / SCENE_IDS.length;
      const y = st.start + (st.end - st.start) * progress;
      if (reducedMq.matches) {
        window.scrollTo({ top: y, behavior: "auto" });
        return;
      }
      // ScrollSmoother owns scroll position when it's active
      const smoother = ScrollSmoother.get();
      if (smoother) {
        smoother.scrollTo(y, true);
        return;
      }
      // Tween the scroll so the scrubbed timeline plays through instead of jumping
      gsap.to(window, {
        scrollTo: { y, autoKill: false },
        duration: 0.7,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    };
    scrollToSceneRef.current = scrollToScene;

    const onHash = () => {
      const id = window.location.hash.replace("#", "");
      if (SCENE_IDS.includes(id as (typeof SCENE_IDS)[number])) {
        requestAnimationFrame(() => scrollToScene(id));
      }
    };

    const build = () => {
      ctx?.revert();
      ctx = null;
      stRef.current = null;

      const prefersReduced = reducedMq.matches;
      const isMobile = mobileMq.matches;
      const scenes = gsap.utils.toArray<HTMLElement>(
        stage.querySelectorAll("[data-scene]")
      );

      ctx = gsap.context(() => {
        // —— Mobile / reduced: one-at-a-time fade, no pin ——
        if (prefersReduced || isMobile) {
          scenes.forEach((scene) => {
            gsap.set(scene, { clearProps: "all", autoAlpha: 1 });
          });
          gsap.fromTo(
            scenes,
            { autoAlpha: 0, y: 36 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.08,
              ease: "power2.out",
              scrollTrigger: {
                trigger: stage,
                start: "top 75%",
                toggleActions: "play none none reverse",
              },
            }
          );
          return;
        }

        // —— Desktop: pinned stage, absolute scenes, master scrub ——
        // Every scene lives in the same 3D room so travel between them reads
        // as moving through depth, not cross-fading flat panels.
        gsap.set(pin, {
          transformPerspective: 1400,
          perspective: 1400,
          transformStyle: "preserve-3d",
        });

        scenes.forEach((scene, i) => {
          gsap.set(scene, {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            autoAlpha: i === 0 ? 1 : 0,
            transformStyle: "preserve-3d",
            transformPerspective: 1400,
          });
        });

        const n = scenes.length;
        const segment = 1;
        const total = n * segment;
        let prevActiveDot = -1;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: `+=${n * 120}%`,
            pin: pin,
            scrub: 0.85,
            anticipatePin: 1,
            // NOT invalidateOnRefresh: none of the tween values below depend on
            // viewport size, and invalidating re-reads each tween's start value
            // from whatever the element looks like at that instant. A refresh
            // mid-scroll would bake in a half-animated state permanently.
            onUpdate: (self) => {
              stRef.current = self;
              if (progressFillRef.current) {
                progressFillRef.current.style.transform = `scaleX(${self.progress})`;
              }
              // Active progress dots — elastic pop only when the active index changes
              const dots = stage.querySelectorAll("[data-progress-dot]");
              const active = Math.min(
                n - 1,
                Math.floor(self.progress * n + 0.001)
              );
              if (active !== prevActiveDot) {
                prevActiveDot = active;
                dots.forEach((dot, i) => {
                  dot.classList.toggle("bg-primary", i === active);
                  dot.classList.toggle("bg-white/25", i !== active);
                  if (i === active) {
                    gsap.fromTo(
                      dot,
                      { scale: 1.6 },
                      {
                        scale: 1,
                        duration: 0.5,
                        ease: "elastic.out(1, 0.4)",
                        overwrite: true,
                      }
                    );
                  }
                });
              }
            },
            onRefresh: (self) => {
              stRef.current = self;
            },
          },
        });

        stRef.current = tl.scrollTrigger ?? null;

        scenes.forEach((scene, i) => {
          const content = scene.querySelector("[data-scene-content]");
          const media = scene.querySelector("[data-scene-media]");
          const words = scene.querySelectorAll("[data-word]");
          const bullets = scene.querySelectorAll("[data-scene-bullet]");
          const eyebrow = scene.querySelector("[data-scene-eyebrow]");
          const desc = scene.querySelector("[data-scene-desc]");
          const cta = scene.querySelector("[data-scene-cta]");
          const isPrepaid = scene.dataset.scene === "prepaid";
          const gold = scene.querySelector('[data-prepaid-card="gold"]');
          const blue = scene.querySelector('[data-prepaid-card="blue"]');
          const orbs = scene.querySelectorAll("[data-prepaid-orb]");

          const t0 = i * segment;
          // Overlap next enter with previous exit
          const tEnter = i === 0 ? 0 : (i - 1) * segment + 0.7;
          const tHold = t0 + 0.35;
          const tExit = t0 + 0.7;
          const tEnd = t0 + segment;

          tl.set(scene, { autoAlpha: 1 }, tEnter);

          if (i === 0) {
            // First scene is fully visible at scroll start. These go on the
            // timeline at t=0 rather than as loose gsap.set() calls so the
            // state is re-established on any replay or refresh.
            if (eyebrow) tl.set(eyebrow, { autoAlpha: 1, y: 0, z: 0 }, 0);
            if (words.length)
              tl.set(words, { yPercent: 0, autoAlpha: 1, rotateX: 0, z: 0 }, 0);
            if (desc) tl.set(desc, { autoAlpha: 1, y: 0, z: 0 }, 0);
            if (bullets.length)
              tl.set(bullets, { autoAlpha: 1, x: 0, z: 0, rotateY: 0 }, 0);
            if (cta) tl.set(cta, { autoAlpha: 1, scale: 1, z: 0 }, 0);
            if (gold) {
              tl.set(
                gold,
                { autoAlpha: 1, y: 0, x: 0, z: 0, rotate: -6, rotateY: 0, scale: 1, force3D: true },
                0
              );
              tl.to(gold, { y: -14, duration: 0.25, force3D: true }, tHold);
            }
            if (blue) {
              tl.set(
                blue,
                { autoAlpha: 1, y: 0, x: 0, z: 0, rotate: 4, rotateY: 0, scale: 1, force3D: true },
                0
              );
              tl.to(blue, { y: 12, duration: 0.25, force3D: true }, tHold);
            }
            if (orbs.length) tl.set(orbs, { autoAlpha: 1, y: 0, scale: 1 }, 0);
          } else {
            // Content rushes forward out of depth, each layer at its own rate
            if (content) {
              tl.set(
                content,
                { transformStyle: "preserve-3d", transformPerspective: 1400 },
                0
              );
            }

            // Every entrance below is a fromTo, not a bare gsap.set() followed
            // by a to(). The start state has to live INSIDE the timeline —
            // otherwise a ScrollTrigger refresh (fonts, images, resize) wipes
            // it and these scenes render blank or frozen.
            if (eyebrow) {
              tl.fromTo(
                eyebrow,
                { autoAlpha: 0, y: 24, z: -260 },
                { autoAlpha: 1, y: 0, z: 0, duration: 0.18, force3D: true },
                tEnter
              );
            }

            if (words.length) {
              tl.fromTo(
                words,
                {
                  yPercent: 110,
                  autoAlpha: 0,
                  rotateX: -68,
                  z: -160,
                  transformOrigin: "50% 0%",
                  transformPerspective: 900,
                },
                {
                  yPercent: 0,
                  autoAlpha: 1,
                  rotateX: 0,
                  z: 0,
                  duration: 0.3,
                  stagger: 0.04,
                  force3D: true,
                },
                tEnter + 0.04
              );
            }

            if (desc) {
              tl.fromTo(
                desc,
                { autoAlpha: 0, y: 30, z: -180 },
                { autoAlpha: 1, y: 0, z: 0, duration: 0.2, force3D: true },
                tEnter + 0.12
              );
            }

            if (bullets.length) {
              tl.fromTo(
                bullets,
                {
                  autoAlpha: 0,
                  x: -24,
                  z: -140,
                  rotateY: 24,
                  transformOrigin: "0% 50%",
                },
                {
                  autoAlpha: 1,
                  x: 0,
                  z: 0,
                  rotateY: 0,
                  duration: 0.22,
                  stagger: 0.05,
                  force3D: true,
                },
                tEnter + 0.16
              );
            }

            if (cta) {
              tl.fromTo(
                cta,
                { autoAlpha: 0, scale: 0.92, z: -120 },
                {
                  autoAlpha: 1,
                  scale: 1,
                  z: 0,
                  duration: 0.18,
                  force3D: true,
                },
                tEnter + 0.22
              );
            }

            if (media) {
              const enterX = i % 2 === 0 ? 80 : -80;
              tl.fromTo(
                media,
                {
                  autoAlpha: 0,
                  y: 70,
                  x: enterX,
                  z: -620,
                  rotateY: i % 2 === 0 ? -38 : 38,
                  rotateX: 12,
                  scale: 0.88,
                  transformPerspective: 1400,
                  force3D: true,
                },
                {
                  autoAlpha: 1,
                  y: 0,
                  x: 0,
                  z: 0,
                  rotateY: 0,
                  rotateX: 0,
                  scale: 1,
                  duration: 0.32,
                  transformPerspective: 1400,
                  force3D: true,
                },
                tEnter + 0.08
              );
              // Mid-scene drift keeps the object alive while you read
              tl.to(
                media,
                {
                  y: -18,
                  z: 60,
                  rotateY: i % 2 === 0 ? 5 : -5,
                  duration: 0.22,
                  force3D: true,
                },
                tHold
              );
            }
          }

          // Exit
          if (i < n - 1) {
            if (isPrepaid) {
              if (gold) {
                tl.to(
                  gold,
                  {
                    y: -200,
                    x: -100,
                    z: 460,
                    rotate: -32,
                    rotateY: -40,
                    scale: 1.15,
                    autoAlpha: 0,
                    duration: 0.28,
                    transformPerspective: 1400,
                    force3D: true,
                  },
                  tExit
                );
              }
              if (blue) {
                tl.to(
                  blue,
                  {
                    y: 180,
                    x: 120,
                    z: 380,
                    rotate: 26,
                    rotateY: 38,
                    scale: 1.1,
                    autoAlpha: 0,
                    duration: 0.28,
                    transformPerspective: 1400,
                    force3D: true,
                  },
                  tExit
                );
              }
              if (orbs.length) {
                tl.to(orbs, { autoAlpha: 0, y: -40, duration: 0.2 }, tExit);
              }
            } else if (media) {
              // Each media exits through a different axis of the same 3D room
              const exitVars =
                i === 1
                  ? {
                      y: -140,
                      z: 420,
                      rotateX: -34,
                      scale: 1.1,
                      autoAlpha: 0,
                    }
                  : i === 2
                    ? {
                        x: 140,
                        z: 380,
                        rotateY: 52,
                        scale: 1.05,
                        autoAlpha: 0,
                      }
                    : { y: 120, z: -520, rotateX: 22, scale: 0.7, autoAlpha: 0 };
              tl.to(
                media,
                {
                  ...exitVars,
                  duration: 0.28,
                  transformPerspective: 1400,
                  force3D: true,
                },
                tExit
              );
            }

            if (content) {
              tl.to(
                content,
                {
                  autoAlpha: 0,
                  x: -60,
                  z: -480,
                  rotateY: 22,
                  duration: 0.26,
                  transformPerspective: 1400,
                  transformOrigin: "0% 50%",
                  force3D: true,
                },
                tExit + 0.02
              );
            }

            tl.set(scene, { autoAlpha: 0 }, tEnd - 0.02);
          } else {
            tl.to(
              scene,
              { autoAlpha: 0.4, y: -24, duration: 0.18, force3D: true },
              tEnd - 0.18
            );
          }
        });

        // Ensure timeline length
        tl.to({}, { duration: 0.01 }, total);
      }, stage);

      // Handle initial hash after ST ready
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        onHash();
      });
    };

    build();
    window.addEventListener("hashchange", onHash);
    mobileMq.addEventListener("change", build);
    reducedMq.addEventListener("change", build);

    return () => {
      window.removeEventListener("hashchange", onHash);
      mobileMq.removeEventListener("change", build);
      reducedMq.removeEventListener("change", build);
      ctx?.revert();
      stRef.current = null;
    };
  }, []);

  return (
    <section
      ref={stageRef}
      data-product-stage
      /* No opaque background: this section covers the longest stretch of the
         page, and bg-darkmode here would occlude the global WebGL layer for
         most of the scroll. The translucent `section` default applies. */
      className="relative z-1"
    >
      <div
        ref={pinRef}
        data-stage-pin
        className="relative min-h-screen overflow-hidden"
      >
        {/* Shared ambient glow — same for all scenes */}
        <div className="pointer-events-none absolute w-50 h-50 bg-gradient-to-bl from-tealGreen from-40% to-charcoalGray to-70% blur-400 rounded-full -bottom-40 -left-20 -z-1 opacity-60" />
        <div className="pointer-events-none absolute w-50 h-50 bg-gradient-to-tr from-tealGreen from-40% to-charcoalGray to-70% blur-400 rounded-full -top-32 right-0 -z-1 opacity-40" />

        {productSections.map((section) => (
          <ProductScene
            key={section.id}
            id={section.id}
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.description}
            bullets={section.bullets}
            cta={section.cta}
            image={section.image}
            imageAlt={section.imageAlt}
            variant={section.id === "prepaid" ? "prepaid" : "default"}
          />
        ))}

        {/* Progress UI */}
        <div className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
          <div className="flex gap-2">
            {productSections.map((s) => (
              <button
                key={s.id}
                type="button"
                data-progress-dot
                aria-label={s.title}
                className="h-2 w-2 rounded-full bg-white/25 transition-colors"
                onClick={() => {
                  // Scroll directly (works on repeat clicks, unlike hashchange)
                  // and keep the URL in sync without triggering a jump.
                  scrollToSceneRef.current(s.id);
                  window.history.replaceState(null, "", `#${s.id}`);
                }}
              />
            ))}
          </div>
          <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
            <div
              ref={progressFillRef}
              className="h-full w-full origin-left scale-x-0 bg-primary"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductScrollStage;
