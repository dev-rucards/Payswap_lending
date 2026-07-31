import React from "react";
import Hero from "@/components/Home/Hero";
import ProductSections from "@/components/Home/Products";
import ContactCta from "@/components/Home/ContactCta";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payswap | Prepaid Cards, Brand Vouchers & Corporate Gifting",
  description:
    "Payswap powers prepaid cards, brand vouchers, corporate gifting, and financial inclusion products for modern businesses.",
};

export default function Home() {
  return (
    <main>
      <Hero />
      <ProductSections />
      <ContactCta />
    </main>
  );
}
