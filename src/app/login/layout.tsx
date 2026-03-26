import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In – DocuAI",
  description: "Log in to your DocuAI account to manage your documents.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
