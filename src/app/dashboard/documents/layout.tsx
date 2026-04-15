import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents – DocuAI",
  description: "Browse, search and manage all your processed documents.",
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
