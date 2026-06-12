/**
 * The Archive — deeper surveys. Academic work from before and beside the
 * essays; the PDFs live in /public/works. "Some of my most enjoyable works."
 */
export interface Work {
  id: string;
  title: string;
  subtitle?: string;
  discipline: string;
  venue: string; // course / lab / advisor context
  year: string;
  pdf: string;
  note: string;
}

export const works: Work[] = [
  {
    id: "aldol",
    title: "Stereoselectivity & Spectroscopy in the Aldol Condensation",
    subtitle: "of Benzaldehyde and Acetone",
    discipline: "Organic Chemistry",
    venue: "O-Chem Laboratory 359 · with J. A. Jaeger",
    year: "2024",
    pdf: "/works/aldol-condensation.pdf",
    note: "Enolate-driven synthesis of dibenzalacetone — TLC, IR, and NMR converging on a single (E)-isomer.",
  },
  {
    id: "inertia",
    title: "The Inertia of Inequality",
    discipline: "Social Psychology",
    venue: "Dr. Gaertner's lab",
    year: "2024",
    pdf: "/works/inertia-of-inequality.pdf",
    note: "The paradoxes of human progress — refining a study design on implicit and explicit bias with reaction-time metrics and reflective writing.",
  },
  {
    id: "fault-lines",
    title: "Fault Lines and Failures",
    subtitle: "Tectonic Trials — Turkey & Syria, 2023",
    discipline: "Natural Hazards",
    venue: "Geology 331 · Dr. Kerr",
    year: "2024",
    pdf: "/works/fault-lines-and-failures.pdf",
    note: "When the ground whispers warnings: evaluating two nations' seismic preparedness, and the cost of ignoring it.",
  },
  {
    id: "synthetic-salvation",
    title: "Synthetic Salvation",
    subtitle: "From Genes to Machines",
    discipline: "Bioethics",
    venue: "Dr. Frank",
    year: "2024",
    pdf: "/works/synthetic-salvation.pdf",
    note: "Xenotransplantation, neural interfaces, prosthetics — charting where innovation must answer to human dignity.",
  },
];
