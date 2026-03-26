import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up – DocuAI",
  description:
    "Create your DocuAI account and start processing documents with AI.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
