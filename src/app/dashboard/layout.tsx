import type { Metadata } from "next";
import DashboardClientProvider from "@/components/dashboard/DashboardClientProvider";

export const metadata: Metadata = {
  title: "Dashboard – Invonix",
  description: "Manage your documents, track processing, and review extracted data.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientProvider>{children}</DashboardClientProvider>;
}
