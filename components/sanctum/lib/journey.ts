import { gardenPathNodes } from "@/data/gardenPaths";
import type { GardenBranch } from "@/data/gardenFeatures";

/**
 * The unified Sanctum journey graph. The existing garden path graph becomes the
 * Living Sanctum walk verbatim (so all the narrative content + branching is
 * reused), and two new nodes are prepended in front of the trailhead:
 *
 *   room ──step──▶ threshold ──step──▶ start ──▶ website-tree ──▶ … ──▶ fork ⤵
 *
 * `zone` drives which environment renders + lighting/fog/postFX mood. Camera
 * easing, look-around and fork-waiting all key off these node fields, exactly
 * like the old node walk — no bespoke spline bookkeeping.
 */
export type Zone = "room" | "threshold" | "sanctum";

export interface JourneyNode {
  id: string;
  zone: Zone;
  branch: GardenBranch;
  label: string;
  type: "start" | "feature" | "fork" | "return";
  /** ground point; the rig lifts the camera to eye height. */
  position: [number, number, number];
  lookAt: [number, number, number];
  nextNodes: string[];
  previousNode?: string;
  featureId?: string;
  /** higher = faster ease toward this node. */
  cameraSpeed: number;
  allowLookAround: boolean;
}

const ROOM_NODES: JourneyNode[] = [
  {
    id: "room",
    zone: "room",
    branch: "main",
    label: "The Room of Entanglement",
    type: "start",
    position: [0, 0, 25],
    lookAt: [0, 1.4, 14],
    nextNodes: ["threshold"],
    cameraSpeed: 0.5,
    allowLookAround: true,
  },
  {
    id: "threshold",
    zone: "threshold",
    branch: "main",
    label: "The Threshold",
    type: "feature",
    position: [0, 0, 14],
    lookAt: [0, 1.25, 2],
    nextNodes: ["start"],
    previousNode: "room",
    cameraSpeed: 0.42,
    allowLookAround: true,
  },
];

/** garden path nodes, retagged into the sanctum zone. */
const SANCTUM_WALK: JourneyNode[] = gardenPathNodes.map((n) => ({
  id: n.id,
  zone: "sanctum" as const,
  branch: n.branch,
  label: n.label,
  type: n.type,
  position: n.position,
  lookAt: n.lookAt,
  nextNodes: n.nextNodes,
  previousNode: n.id === "start" ? "threshold" : n.previousNode,
  featureId: n.featureId,
  cameraSpeed: n.cameraSpeed ?? 0.65,
  allowLookAround: n.allowLookAround ?? true,
}));

export const journeyNodes: JourneyNode[] = [...ROOM_NODES, ...SANCTUM_WALK];

export const journeyNodeMap = new Map(journeyNodes.map((n) => [n.id, n]));

export function journeyNodeById(id: string): JourneyNode {
  const n = journeyNodeMap.get(id);
  if (!n) throw new Error(`Unknown sanctum journey node: ${id}`);
  return n;
}

export const FIRST_NODE = "room";
/** the trailhead where the Living Sanctum opens — the "step through" target. */
export const SANCTUM_ENTRY = "start";

/** eye height the rig adds to a node's ground position. */
export const EYE_HEIGHT = 1.62;

export function branchLabel(branch: GardenBranch) {
  if (branch === "medicine") return "Medicine & Study";
  if (branch === "projects") return "Projects & Life";
  return "Main Trail";
}
