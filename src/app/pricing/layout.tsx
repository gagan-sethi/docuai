import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – DocuAI",
  description:
    "Simple, transparent pricing for AI-powered document processing. Start free, scale as you grow.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
