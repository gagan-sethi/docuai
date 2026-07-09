import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Invonix",
  description:
    "Create your Invonix account and start automating finance documents with AI.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
