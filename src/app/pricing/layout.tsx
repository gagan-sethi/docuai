import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Invonix",
  description:
    "Pricing for Invonix finance automation plans for small businesses, growing finance teams, accounting firms, and enterprises.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
