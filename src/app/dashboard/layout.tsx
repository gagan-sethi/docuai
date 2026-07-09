import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard – Invonix",
  description: "Manage your documents, track processing, and review extracted data.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
