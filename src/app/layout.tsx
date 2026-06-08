import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Invonix - AI-Powered Finance Automation Platform",
  description:
    "Automate invoice processing, expense management, VAT reporting, purchase orders, document extraction, and financial insights with Invonix.",
  keywords: [
    "finance automation",
    "invoice automation",
    "expense management",
    "VAT reporting",
    "AI document extraction",
    "accounting automation",
    "financial analytics",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col bg-white text-foreground"
        suppressHydrationWarning
      >
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
