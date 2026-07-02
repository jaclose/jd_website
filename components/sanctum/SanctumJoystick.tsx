"use client";
import { useEffect, useRef, useState } from "react";
import { touchMove } from "./lib/store";

/**
 * Left-thumb walk stick for touch devices — the missing half of the mobile
 * controls (drag already looks around). A fixed ring low-left; dragging the
 * thumb writes an analog vector into the `touchMove` bridge that the camera
 * rig consumes each frame (walking with it auto-enters free-roam, same as
 * WASD). Renders only on coarse pointers and only in the Living Sanctum.
 * The thumb dot follows via direct style writes — no React state per move.
 */
const RADIUS = 52; // px travel of the thumb from centre

export default function SanctumJoystick({ visible }: { visible: boolean }) {
  const [coarse, setCoarse] = useState(false);
  const thumb = useRef<HTMLDivElement>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // never leave the walker running if the stick unmounts mid-press
  useEffect(
    () => () => {
      touchMove.x = 0;
      touchMove.y = 0;
      touchMove.active = false;
    },
    [],
  );

  if (!visible || !coarse) return null;

  const setThumb = (dx: number, dy: number) => {
    if (thumb.current) thumb.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation(); // the stage must not treat this as a look-drag
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointer — tracking still works via move events */
    }
    origin.current = { x: e.clientX, y: e.clientY };
    touchMove.active = true;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!origin.current) return;
    e.stopPropagation();
    let dx = e.clientX - origin.current.x;
    let dy = e.clientY - origin.current.y;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setThumb(dx, dy);
    touchMove.x = dx / RADIUS;
    touchMove.y = dy / RADIUS; // +y = pull down = walk backward
  };
  const end = (e: React.PointerEvent) => {
    e.stopPropagation();
    origin.current = null;
    touchMove.x = 0;
    touchMove.y = 0;
    touchMove.active = false;
    setThumb(0, 0);
  };

  return (
    <div
      className="absolute bottom-36 left-6 z-30 touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Walk joystick"
      role="application"
    >
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-hairline bg-[rgba(5,10,7,0.4)] backdrop-blur-sm">
        <span className="label pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-[7px]! tracking-[0.24em]! text-leaf/60">
          Walk
        </span>
        <div
          ref={thumb}
          className="h-12 w-12 rounded-full border border-leaf/50 bg-leaf/15 shadow-[0_0_18px_rgba(159,206,143,0.25)]"
        />
      </div>
    </div>
  );
}
