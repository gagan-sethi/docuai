import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics – Invonix",
  description: "Document processing trends, accuracy, and supplier insights.",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
