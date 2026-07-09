import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing – Invonix",
  description: "Manage your plan, view usage, and download past invoices.",
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
