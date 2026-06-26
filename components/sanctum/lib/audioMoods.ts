import type { Zone } from "./journey";

/**
 * Per-zone audio moods — the soundscape twin of `moods.ts`. Each zone declares a
 * target level for every procedural layer; `SanctumAudioSystem` eases each layer's
 * gain toward the active zone's target (Web Audio `setTargetAtTime`), so walking
 * room → threshold → sanctum crossfades the whole mix the same way the light and
 * fog crossfade. The Room is a cold interior hum; the Threshold leaks the first
 * outside air and birds; the Living Sanctum is a full forest bed.
 */
export interface AudioMood {
  /** broadband wind bed volume. */
  wind: number;
  /** lowpass cutoff (Hz) for the wind bed — brighter and airier outside. */
  windCutoff: number;
  /** cold interior hum (HVAC-ish) — only the Room. */
  roomHum: number;
  /** high, papery leaf-rustle bed. */
  leaves: number;
  /** birdsong density/level (0..1) — scales the chirp scheduler. */
  birds: number;
  /** fine insect shimmer up top. */
  insects: number;
  /** positional stream/water level at the tide-pool landmark. */
  water: number;
}

export const AUDIO_MOODS: Record<Zone, AudioMood> = {
  room: {
    wind: 0.02,
    windCutoff: 240,
    roomHum: 0.1,
    leaves: 0,
    birds: 0,
    insects: 0,
    water: 0,
  },
  threshold: {
    wind: 0.1,
    windCutoff: 440,
    roomHum: 0.03,
    leaves: 0.06,
    birds: 0.18,
    insects: 0.02,
    water: 0.08,
  },
  sanctum: {
    wind: 0.16,
    windCutoff: 760,
    roomHum: 0,
    leaves: 0.15,
    birds: 0.6,
    insects: 0.11,
    water: 0.55,
  },
};
