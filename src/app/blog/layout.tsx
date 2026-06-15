import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog – Invonix | Finance Automation Insights",
  description: "Expert guides on AI-powered finance automation, invoice processing, VAT compliance, and accounting efficiency. Tips and product updates from the Invonix team.",
  keywords: ["finance automation", "invoicing", "VAT compliance", "accounting", "AI", "expense tracking"],
  authors: [{ name: "Invonix Team" }],
  creator: "Invonix",
  publisher: "Invonix",
  openGraph: {
    title: "Blog – Invonix",
    description: "Expert guides on AI-powered finance automation and accounting efficiency.",
    url: "https://invonix.com/blog",
    siteName: "Invonix",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://invonix.com/og-image.jpg", // Update with your OG image
        width: 1200,
        height: 630,
        alt: "Invonix Blog",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog – Invonix",
    description: "Expert guides on AI-powered finance automation.",
    images: ["https://invonix.com/og-image.jpg"], // Update with your image
    creator: "@invonix", // Update with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
  verification: {
    google: "", // Add your verification code if needed
  },
  alternates: {
    canonical: "https://invonix.com/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* JSON-LD Schema for Blog */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Invonix Blog",
            description: "Expert guides on AI-powered finance automation and accounting efficiency.",
            url: "https://invonix.com/blog",
            image: "https://invonix.com/og-image.jpg",
            publisher: {
              "@type": "Organization",
              name: "Invonix",
              logo: {
                "@type": "ImageObject",
                url: "https://invonix.com/logo.png",
              },
            },
            author: {
              "@type": "Organization",
              name: "Invonix Team",
            },
          }),
        }}
      />
      {children}
    </>
  );
}