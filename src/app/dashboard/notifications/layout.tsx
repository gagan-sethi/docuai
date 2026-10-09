import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications – Invonix",
  description: "Alerts about processing, approvals, and plan limits.",
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
