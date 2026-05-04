import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept invitation – DocuAI",
  description: "Join your teammate's workspace on DocuAI.",
};

export default function TeamAcceptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
