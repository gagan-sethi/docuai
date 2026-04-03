import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import WhatsAppSection from "@/components/WhatsAppSection";
import DemoSection from "@/components/DemoSection";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Partners from "@/components/Partners";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Stats />
        <HowItWorks />
        <WhatsAppSection />
        <DemoSection />
        <Testimonials />
        <Pricing />
        <Partners />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
