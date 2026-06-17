import { gardenFeatures } from "./gardenFeatures";

export const medicineTimeline = gardenFeatures.filter((feature) => feature.branch === "medicine");
export const projectsTimeline = gardenFeatures.filter((feature) => feature.branch === "projects");
export const mainTrailFeatures = gardenFeatures.filter((feature) => feature.branch === "main");
