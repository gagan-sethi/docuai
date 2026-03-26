import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "DocuAI – AI-Powered Document Processing Platform",
  description:
    "Stop manual data entry. Upload any document and get structured data instantly. AI-powered OCR with 90-95% accuracy for invoices, purchase orders, and more.",
  keywords: [
    "document processing",
    "AI OCR",
    "invoice processing",
    "data extraction",
    "automation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-foreground">
        {children}
      </body>
    </html>
  );
}
