import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept invitation – Invonix",
  description: "Join your teammate's workspace on Invonix.",
};

export default function TeamAcceptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
