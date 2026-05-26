import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Dashboard – DocuAI",
  description: "Revenue, Expenses, Net Profit and VAT computed from processed documents.",
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
