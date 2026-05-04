import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings – DocuAI",
  description: "Update your profile, preferences, and account security.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
