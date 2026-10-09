import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact – Invonix",
  description:
    "Get in touch with the Invonix team about support, sales, partnerships or privacy requests.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
