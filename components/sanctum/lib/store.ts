/**
 * Module-level bridges between the DOM overlay and the in-canvas scene. R3F runs
 * a separate reconciler, so React context does not cross the boundary — but a
 * plain module object does, and (like the hero's store) keeps per-frame data out
 * of React state. The overlay writes; the camera rig reads each frame.
 */

/**
 * normalized cursor/touch position over the stage, −1..1, for look-around, plus
 * accumulated drag deltas (`dragDX/dragDY`, consumed each frame by the rig) that
 * drive true 360° turning in free-roam — dragging keeps turning past the clamp.
 */
export const pointerLook = { x: 0, y: 0, dragDX: 0, dragDY: 0, enabled: true };

/** set by the rig; lets the overlay show a soft "arriving…" state if wanted. */
export const cameraState = { arrived: true };

/**
 * On-screen joystick bridge (touch walking). The DOM joystick writes a
 * normalized analog vector (x strafe, y forward-negative, each −1..1) plus
 * `active`; the camera rig reads it every frame alongside the keys. Walking
 * with the stick auto-enters free-roam exactly like WASD does.
 */
export const touchMove = { x: 0, y: 0, active: false };

/**
 * Written by the camera rig every frame: the visitor's feet position and facing.
 * The quest sensor and the DOM tracker read it (never through React state).
 */
export const playerState = { x: 0, y: 0, z: 25, yaw: Math.PI, moving: false };

/**
 * The tracked quest's next objective, written by the DOM tracker; the in-canvas
 * guide beacon reads it. `active` false hides the guide entirely.
 */
export const guideTarget = { active: false, x: 0, y: 0, z: 0, label: "" };

type FreeRoamListener = (on: boolean) => void;
const freeRoamListeners = new Set<FreeRoamListener>();

/**
 * Movement / control bridge. Free-roam can now be entered from either side:
 * the DOM overlay's "Walk here" toggle, or the rig itself when the visitor just
 * starts walking with WASD — so both call `setFreeRoam` and both subscribe.
 * Free-roam is still collision- and bounds-clamped — never free-fly. `focused`
 * mirrors whether the visitor has taken control inline on the homepage so the
 * overlay can pause page scroll/snap.
 */
export const sanctumControl = {
  freeRoam: false,
  focused: false,
  setFreeRoam(on: boolean) {
    if (this.freeRoam === on) return;
    this.freeRoam = on;
    for (const l of freeRoamListeners) l(on);
  },
  onFreeRoam(listener: FreeRoamListener) {
    freeRoamListeners.add(listener);
    return () => {
      freeRoamListeners.delete(listener);
    };
  },
};

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
