"use client";

import Image from "next/image";
import Link from "next/link";
import { getImagePrefix } from "@/utils/utils";
import MagneticButton from "@/components/animations/MagneticButton";

type ProductSceneProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: readonly string[];
  cta: { label: string; href: string };
  image?: string;
  imageAlt?: string;
  variant?: "prepaid" | "default";
};

const splitWords = (text: string) =>
  text.split(" ").map((word, i) => (
    <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
      <span data-word className="inline-block will-change-transform">
        {word}
        {i < text.split(" ").length - 1 ? "\u00A0" : ""}
      </span>
    </span>
  ));

const ProductScene = ({
  id,
  eyebrow,
  title,
  description,
  bullets,
  cta,
  image,
  imageAlt,
  variant = "default",
}: ProductSceneProps) => {
  const prefix = getImagePrefix();

  return (
    <article
      id={id}
      data-scene={id}
      className="relative lg:absolute lg:inset-0 flex items-center overflow-hidden min-h-[auto] lg:min-h-0 py-16 lg:py-0"
    >
      {/* py-24 only below lg. On desktop the scene is absolutely positioned and
          already vertically centred, so the extra 192px of padding just pushes
          content past the pinned viewport where overflow-hidden clips it. */}
      <div className="container mx-auto lg:max-w-screen-xl px-4 py-24 lg:py-0 w-full">
        <div className="grid grid-cols-12 gap-10 items-center">
          <div
            data-scene-content
            className={
              variant === "prepaid"
                ? "lg:col-span-5 col-span-12"
                : "lg:col-span-6 col-span-12"
            }
          >
            <p
              data-scene-eyebrow
              className="text-primary text-18 font-medium mb-4"
            >
              {eyebrow}
            </p>
            <h2
              data-scene-title
              className="text-white lg:text-70 md:text-55 text-40 font-medium mb-6 leading-tight"
            >
              {splitWords(title)}
            </h2>
            <p
              data-scene-desc
              className="text-muted text-18 mb-8 max-w-xl"
            >
              {description}
            </p>
            <ul data-scene-bullets className="space-y-4 mb-10">
              {bullets.map((bullet) => (
                <li
                  key={bullet}
                  data-scene-bullet
                  className="flex gap-3 items-start text-white text-17"
                >
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <MagneticButton>
              <Link
                data-scene-cta
                href={cta.href}
                className="inline-block bg-primary border border-primary rounded-lg text-18 font-medium hover:bg-transparent hover:text-primary text-darkmode py-3 px-8 transition-colors"
              >
                {cta.label}
              </Link>
            </MagneticButton>
          </div>

          <div
            data-scene-media
            className={
              variant === "prepaid"
                ? "lg:col-span-7 col-span-12 relative h-[360px] md:h-[460px]"
                : "lg:col-span-6 col-span-12 relative h-[320px] md:h-[400px]"
            }
            /* Perspective is only meaningful for the prepaid variant, whose
               gold/blue card children rotate in 3D. For the other scenes this
               element is itself the animated target and gets its perspective
               baked in by GSAP's transformPerspective. */
            style={
              variant === "prepaid" ? { perspective: "1200px" } : undefined
            }
          >
            {variant === "prepaid" ? (
              <>
                <div
                  data-prepaid-card="gold"
                  className="absolute left-[2%] top-[4%] w-[62%] md:w-[56%] z-20 will-change-transform"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={`${prefix}images/products/prepaid-gold-stack.svg`}
                      alt="Gold prepaid cards"
                      fill
                      sizes="(min-width: 1024px) 32vw, 75vw"
                      className="object-contain drop-shadow-[0_28px_48px_rgba(0,0,0,0.55)]"
                      priority
                    />
                  </div>
                </div>
                <div
                  data-prepaid-card="blue"
                  className="absolute right-0 bottom-[2%] w-[72%] md:w-[64%] z-10 will-change-transform"
                >
                  <div className="relative aspect-[72/52]">
                    <Image
                      src={`${prefix}images/products/prepaid-blue-stack.svg`}
                      alt="Blue prepaid cards"
                      fill
                      sizes="(min-width: 1024px) 36vw, 80vw"
                      className="object-contain drop-shadow-[0_32px_52px_rgba(0,0,0,0.5)]"
                      priority
                    />
                  </div>
                </div>
                <div
                  data-prepaid-orb
                  className="absolute top-8 right-[18%] w-3 h-3 rounded-full bg-primary shadow-[0_0_20px_#99E39E]"
                />
                <div
                  data-prepaid-orb
                  className="absolute bottom-20 left-[12%] w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_16px_#1DC8CD]"
                />
              </>
            ) : (
              /* No Tilt3D wrapper here. [data-scene-media] is already being
                 driven in 3D by the pinned scroll timeline; nesting a second
                 perspective + preserve-3d context inside it gets flattened by
                 the ancestor's overflow:hidden, and the hover tilt fights the
                 scroll transform on the same subtree. That combination is what
                 made the voucher / gifting / inclusion artwork render wrong. */
              image && (
                <Image
                  src={`${prefix}${image}`}
                  alt={imageAlt || title}
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] will-change-transform"
                />
              )
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductScene;
