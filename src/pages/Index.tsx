import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { HeroSection } from "@/components/instituto/HeroSection";
import { PainPointsSection } from "@/components/instituto/PainPointsSection";
import { AboutSection } from "@/components/instituto/AboutSection";
import { ServicesSection } from "@/components/instituto/ServicesSection";
import { HowItWorksSection } from "@/components/instituto/HowItWorksSection";
import { ProfessionalsSection } from "@/components/instituto/ProfessionalsSection";
import { TestimonialsSection } from "@/components/instituto/TestimonialsSection";
import { CtaSection } from "@/components/instituto/CtaSection";
import { RoomRentalSection } from "@/components/instituto/RoomRentalSection";
import { LeadCaptureSection } from "@/components/instituto/LeadCaptureSection";
import { HelenaChat } from "@/components/instituto/HelenaChat";

const Index = () => {
  return (
    <Layout>
      <Seo
        title="Instituto Integra — Neuropsicologia em Uberlândia"
        description="Avaliação neuropsicológica, diagnóstico e atendimento clínico em Uberlândia-MG. Acolhimento, ética e profissionalismo. Agende sua consulta."
        path="/"
      />
      <HeroSection />
      <PainPointsSection />
      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />
      <ProfessionalsSection />
      <TestimonialsSection />
      <CtaSection />
      <RoomRentalSection />
      <LeadCaptureSection />
      <HelenaChat />
    </Layout>
  );
};

export default Index;
