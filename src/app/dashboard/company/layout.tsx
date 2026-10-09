import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Companies – Invonix",
  description: "Manage the company entities in your workspace.",
};

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
