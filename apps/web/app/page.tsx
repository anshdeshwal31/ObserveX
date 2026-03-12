import { BrandStrip } from "./components/landing/brand-strip";
import { FaqSection } from "./components/landing/faq-section";
import { FeaturesSection } from "./components/landing/features-section";
import { Footer } from "./components/landing/footer";
import { HeroSection } from "./components/landing/hero-section";
import { PricingSection } from "./components/landing/pricing-section";
import { StatsBand } from "./components/landing/stats-band";
import { WorkflowSection } from "./components/landing/workflow-section";

export default function Home() {
  return (
    <div className="pb-0">
      <HeroSection />
      {/* <BrandStrip /> removed as per request */}
      <StatsBand />
      <FeaturesSection />
      <WorkflowSection />
      <PricingSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
