import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team – Invonix",
  description: "Invite teammates, manage roles, and track seat usage on your Invonix workspace.",
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
