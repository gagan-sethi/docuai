import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity – Invonix",
  description: "A record of uploads, approvals, exports, and account changes.",
};

export default function ActivitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
