export const heroContent = {
  eyebrow: "Payswap",
  titleBefore: "Prepaid cards &",
  titleHighlight: "brand vouchers",
  titleAfter: "built for modern gifting",
  description:
    "Issue prepaid cards, deliver brand vouchers instantly, run corporate campaigns, and expand financial access — all from one platform.",
  primaryCta: { label: "Explore Products", href: "#prepaid" },
  secondaryCta: { label: "Talk to Sales", href: "#contact-cta" },
  chips: [
    "Prepaid Cards",
    "Brand Vouchers",
    "Corporate Gifting",
    "Financial Inclusion",
  ],
};

export const productSections = [
  {
    id: "prepaid",
    eyebrow: "Product 01",
    title: "Prepaid Cards",
    description:
      "Launch reloadable and gift prepaid cards with instant issuance, flexible loads, and controls built for consumer and enterprise programs.",
    bullets: [
      "Instant virtual & physical card issuance",
      "Load, reload, and spend controls with KYC-ready flows",
      "Ideal for payroll, incentives, travel, and everyday spend",
    ],
    cta: { label: "See prepaid solutions", href: "#contact-cta" },
    image: "images/products/prepaid-card-3d.svg",
    imageAlt: "Payswap prepaid card illustration",
  },
  {
    id: "vouchers",
    eyebrow: "Product 02",
    title: "Brand Vouchers",
    description:
      "Offer top brand vouchers your customers already love — Amazon, Flipkart, Myntra, and more — with instant digital delivery.",
    bullets: [
      "Catalog of leading lifestyle & commerce brands",
      "Instant email/SMS delivery with secure codes",
      "Perfect for rewards, cashback, and promotions",
    ],
    cta: { label: "Browse voucher catalog", href: "#contact-cta" },
    image: "images/products/voucher-stack.svg",
    imageAlt: "Brand voucher stack illustration",
  },
  {
    id: "gifting",
    eyebrow: "Product 03",
    title: "Corporate Gifting",
    description:
      "Run festivals, milestones, and employee recognition at scale with branded campaigns, bulk sends, and clear reporting.",
    bullets: [
      "Bulk uploads and scheduled campaign sends",
      "Custom branding and occasion-ready templates",
      "Usage insights for HR, marketing, and finance teams",
    ],
    cta: { label: "Plan a campaign", href: "#contact-cta" },
    image: "images/products/corporate-gift.svg",
    imageAlt: "Corporate gifting illustration",
  },
  {
    id: "inclusion",
    eyebrow: "Product 04",
    title: "Financial Inclusion",
    description:
      "Extend trusted payouts and prepaid access to underserved users with compliant rails designed for reach and reliability.",
    bullets: [
      "Inclusive payout and benefit distribution",
      "Compliant onboarding with audit-friendly trails",
      "Built to scale across regions and partner networks",
    ],
    cta: { label: "Partner with us", href: "#contact-cta" },
    image: "images/products/inclusion-network.svg",
    imageAlt: "Financial inclusion network illustration",
  },
] as const;

export const ctaContent = {
  id: "contact-cta",
  title: "Ready to power gifting and prepaid at scale?",
  description:
    "Whether you need cards, vouchers, corporate campaigns, or inclusive payouts — Payswap helps you launch faster with confidence.",
  primaryCta: { label: "Get started", href: "/signup" },
  secondaryCta: { label: "Sign in", href: "/signin" },
};
