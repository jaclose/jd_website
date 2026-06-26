/**
 * Module-level bridges between the DOM overlay and the in-canvas scene. R3F runs
 * a separate reconciler, so React context does not cross the boundary — but a
 * plain module object does, and (like the hero's store) keeps per-frame data out
 * of React state. The overlay writes; the camera rig reads each frame.
 */

/** normalized cursor/touch position over the stage, −1..1, for look-around. */
export const pointerLook = { x: 0, y: 0, enabled: true };

/** set by the rig; lets the overlay show a soft "arriving…" state if wanted. */
export const cameraState = { arrived: true };

/**
 * Movement / control bridge. The DOM overlay's "Enter / Walk here" toggle writes
 * `freeRoam`; the camera rig reads it each frame to switch from the bounded
 * wander pocket to an open walk across the whole footprint (still collision- and
 * bounds-clamped — never free-fly). `focused` mirrors whether the visitor has
 * taken control inline on the homepage so the overlay can pause page scroll.
 */
export const sanctumControl = { freeRoam: false, focused: false };

/**
 * Audio control bridge. The AudioContext lives inside the canvas (AudioSystem),
 * but it must be resumed from a real user gesture (autoplay policy) — so the DOM
 * toggle calls `resume()`/`apply()` which the AudioSystem registers here.
 */
export const sanctumAudio: {
  on: boolean;
  resume: () => void;
  apply: (on: boolean) => void;
  /** set the active zone so the layered ambience crossfades to its mood. */
  setZone: (zone: "room" | "threshold" | "sanctum") => void;
  /** the camera rig fires this on each footfall so steps are heard on terrain. */
  footstep: () => void;
} = {
  on: false,
  resume: () => {},
  apply: () => {},
  setZone: () => {},
  footstep: () => {},
};
