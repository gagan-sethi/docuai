import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referrals – DocuAI",
  description: "Create promo codes, track referrals, and manage your partner program.",
};

export default function ReferralsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
