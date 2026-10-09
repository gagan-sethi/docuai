import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Tutorials – Invonix",
  description: "Step-by-step video guides for using Invonix.",
};

export default function VideoTutorialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
