import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Documents – DocuAI",
  description: "Upload invoices, purchase orders, and other documents for AI processing.",
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
