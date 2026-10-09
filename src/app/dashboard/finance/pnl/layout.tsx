import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profit & Loss – Invonix",
  description: "Revenue, expenses, and net profit from approved documents.",
};

export default function FinancePnlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
