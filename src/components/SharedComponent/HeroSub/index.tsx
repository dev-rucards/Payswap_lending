"use client";

import React, { FC } from "react";
import TextReveal from "@/components/animations/TextReveal";

interface HeroSubProps {
  title: string;
}

/**
 * Inner-page banner. The heading tumbles in on mount and the backdrop layers
 * scroll at different speeds (ScrollSmoother `data-speed`) so the banner has
 * real depth instead of reading as a flat strip.
 */
const HeroSub: FC<HeroSubProps> = ({ title }) => {
  return (
    <section className="relative overflow-hidden bg-herosub-bg bg-cover bg-no-repeat py-40 lg:mt-40 sm:mt-44 mt-20">
      <div className="container mx-auto lg:max-w-screen-xl px-4">
        <TextReveal
          as="h2"
          split="chars"
          trigger="mount"
          className="text-36 font-medium text-white md:text-56"
        >
          {title}
        </TextReveal>
      </div>

      <div
        data-speed="0.8"
        className="pointer-events-none absolute -top-24 right-10 -z-1 h-40 w-40 rounded-full bg-gradient-to-tr from-tealGreen/60 to-transparent blur-400"
      />
      <div
        data-speed="1.25"
        className="pointer-events-none absolute -bottom-32 left-0 -z-1 h-40 w-40 rounded-full bg-gradient-to-bl from-secondary/30 to-transparent blur-400"
      />
    </section>
  );
};

export default HeroSub;
