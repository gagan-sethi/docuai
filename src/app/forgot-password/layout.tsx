import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password — Invonix",
  description: "Reset your Invonix account password",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
