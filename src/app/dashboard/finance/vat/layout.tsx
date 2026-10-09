import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VAT Report – Invonix",
  description: "VAT collected, VAT paid, and the net position for the period.",
};

export default function FinanceVatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
