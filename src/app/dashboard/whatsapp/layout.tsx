import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Inbox – DocuAI",
  description: "View and manage all documents received via WhatsApp.",
};

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
