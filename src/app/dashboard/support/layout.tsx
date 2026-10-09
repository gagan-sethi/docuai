import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support – Invonix",
  description: "Browse answers and raise a support ticket.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
