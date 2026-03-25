import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/instituto/HeroSection";
import { PainPointsSection } from "@/components/instituto/PainPointsSection";
import { AboutSection } from "@/components/instituto/AboutSection";
import { ServicesSection } from "@/components/instituto/ServicesSection";
import { HowItWorksSection } from "@/components/instituto/HowItWorksSection";
import { ProfessionalsSection } from "@/components/instituto/ProfessionalsSection";
import { TestimonialsSection } from "@/components/instituto/TestimonialsSection";
import { CtaSection } from "@/components/instituto/CtaSection";
import { LeadCaptureSection } from "@/components/instituto/LeadCaptureSection";
import { WhatsAppFloat } from "@/components/instituto/WhatsAppFloat";

const Instituto = () => {
  return (
    <Layout>
      <HeroSection />
      <PainPointsSection />
      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />
      <ProfessionalsSection />
      <TestimonialsSection />
      <CtaSection />
      <LeadCaptureSection />
      <WhatsAppFloat />
    </Layout>
  );
};

export default Instituto;
