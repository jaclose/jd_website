/** Publish an actual update with a new stable slug, ISO date and honest excerpt.
 * Editing a project card is not a newsletter announcement. See docs/email-system.md.
 */
export interface ProjectUpdate { slug: string; title: string; date: string; excerpt: string; url: string; image?: string }
export const projectUpdates: ProjectUpdate[] = [];
