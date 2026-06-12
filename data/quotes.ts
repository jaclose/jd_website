export interface Quote {
  text: string;
  source: string;
  week: string; // ISO date of the Monday this quote took the sky
  /** original-language text, shown above the translation */
  arabic?: string;
}

/** Most recent first. The first entry is the quote of the week. */
export const quotes: Quote[] = [
  {
    text: "Verily, with hardship comes ease.",
    source: "Qur'an 94:6",
    week: "2026-06-08",
    arabic: "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
  },
  {
    text: "The point of a test is to become someone who carries the next one with grace.",
    source: "Anatomy of the Test",
    week: "2026-06-01",
  },
  {
    text: "Courteous in public, careless in private — character is who you are when it matters least.",
    source: "Field Note, 23.11.2025",
    week: "2026-05-25",
  },
];

export const quoteOfTheWeek = quotes[0];
