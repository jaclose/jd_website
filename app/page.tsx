import SpatialHero from "@/components/hero/SpatialHero";
import SectionSnap from "@/components/SectionSnap";
import Statement from "@/components/sections/Statement";
import EssaysGallery from "@/components/sections/EssaysGallery";
import QuoteOfWeek from "@/components/sections/QuoteOfWeek";
import ForestScene from "@/components/sections/ForestScene";
import FieldNotesSection from "@/components/sections/FieldNotesSection";
import WorksArchive from "@/components/sections/WorksArchive";
import TransmissionLog from "@/components/sections/TransmissionLog";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <SpatialHero />
      <SectionSnap
        ids={["statement", "essays", "quote", "garden", "field-notes", "archive", "log"]}
      />
      <div className="relative z-10">
        <Statement />
        <EssaysGallery />
        <QuoteOfWeek />
        <ForestScene />
        <FieldNotesSection />
        <WorksArchive />
        <TransmissionLog />
        <Footer />
      </div>
    </main>
  );
}
