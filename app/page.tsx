import SpatialHero from "@/components/hero/SpatialHero";
import Statement from "@/components/sections/Statement";
import EssaysGallery from "@/components/sections/EssaysGallery";
import QuoteOfWeek from "@/components/sections/QuoteOfWeek";
import GardenTeaser from "@/components/sections/GardenTeaser";
import FieldNotesSection from "@/components/sections/FieldNotesSection";
import WorksArchive from "@/components/sections/WorksArchive";
import TransmissionLog from "@/components/sections/TransmissionLog";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <SpatialHero />
      <div className="relative z-10">
        <Statement />
        <EssaysGallery />
        <QuoteOfWeek />
        <GardenTeaser />
        <FieldNotesSection />
        <WorksArchive />
        <TransmissionLog />
        <Footer />
      </div>
    </main>
  );
}
