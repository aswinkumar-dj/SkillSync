import { LandingFooter } from "../components/landing/footer";
import { FaqSection } from "../components/landing/faq";
import { FinalCtaSection } from "../components/landing/final-cta";
import { HeroSection } from "../components/landing/hero";
import { LandingNavbar } from "../components/landing/navbar";
import { WorkflowSection } from "../components/landing/workflow";

export default function HomePage() {
  return (
    <main className="min-h-screen text-text">
      <LandingNavbar />
      <HeroSection />
      <WorkflowSection />
      <FaqSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}