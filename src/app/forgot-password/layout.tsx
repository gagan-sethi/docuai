import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password — DocuAI",
  description: "Reset your DocuAI account password",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
