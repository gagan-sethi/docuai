import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In - Invonix",
  description: "Log in to your Invonix account to manage finance automation.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
