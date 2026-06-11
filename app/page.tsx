import SpatialHero from "@/components/hero/SpatialHero";
import EssaysIndex from "@/components/sections/EssaysIndex";
import QuoteOfWeek from "@/components/sections/QuoteOfWeek";
import GardenTeaser from "@/components/sections/GardenTeaser";
import FieldNotesSection from "@/components/sections/FieldNotesSection";
import TransmissionLog from "@/components/sections/TransmissionLog";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <SpatialHero />
      <div className="relative z-10">
        <EssaysIndex />
        <QuoteOfWeek />
        <GardenTeaser />
        <FieldNotesSection />
        <TransmissionLog />
        <Footer />
      </div>
    </main>
  );
}
