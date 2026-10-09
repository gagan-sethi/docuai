import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import FinancialIntelligence from "@/components/FinancialIntelligence";
import BatchMergeSection from "@/components/BatchMergeSection";
import HowItWorks from "@/components/HowItWorks";
import WhatsAppSection from "@/components/WhatsAppSection";
import DemoSection from "@/components/DemoSection";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Partners from "@/components/Partners";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { PARTNER_PROGRAM_LIVE } from "@/lib/siteConfig";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <FinancialIntelligence />
        <BatchMergeSection />
        <Stats />
        <HowItWorks />
        <WhatsAppSection />
        <DemoSection />
        <Testimonials />
        <Pricing />
        {/* UX-03: the partner programme has no application page or published
            commission terms yet, so the section is gated rather than sending
            applicants to the ordinary signup form. */}
        {PARTNER_PROGRAM_LIVE && <Partners />}
        <CTA />
      </main>
      <Footer />
    </>
  );
}
