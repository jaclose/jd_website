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
 * Audio control bridge. The AudioContext lives inside the canvas (AudioSystem),
 * but it must be resumed from a real user gesture (autoplay policy) — so the DOM
 * toggle calls `resume()`/`apply()` which the AudioSystem registers here.
 */
export const sanctumAudio: {
  on: boolean;
  resume: () => void;
  apply: (on: boolean) => void;
} = {
  on: false,
  resume: () => {},
  apply: () => {},
};
