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
import { LeadCaptureSection } from "@/components/instituto/LeadCaptureSection";


const Instituto = () => {
  return (
    <Layout>
      <Seo
        title="Instituto Integra — Clínica de Neuropsicologia"
        description="Conheça o Instituto Integra: equipe especializada em neuropsicologia, abordagem clínica acolhedora e serviços de avaliação e diagnóstico em Uberlândia-MG."
        path="/instituto"
      />
      <HeroSection />
      <PainPointsSection />
      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />
      <ProfessionalsSection />
      <TestimonialsSection />
      <CtaSection />
      <LeadCaptureSection />
      
    </Layout>
  );
};

export default Instituto;
