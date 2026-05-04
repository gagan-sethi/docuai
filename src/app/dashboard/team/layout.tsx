import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team – DocuAI",
  description: "Invite teammates, manage roles, and track seat usage on your DocuAI workspace.",
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
