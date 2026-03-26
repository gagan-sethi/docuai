import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Documents – DocuAI",
  description: "Review, validate, and edit AI-extracted data from your documents.",
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
