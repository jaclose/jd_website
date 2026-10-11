import { publicationCatalog } from "./catalog";
export const publications = publicationCatalog;
export function selectPublication(type: string, slug: string) { return publications().find(p => p.type === type && p.slug === slug); }
