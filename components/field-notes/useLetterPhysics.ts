"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Matter from "matter-js";
import { letterStyleThemes } from "@/data/fieldNotesThemes";
import type { FieldNoteRecord } from "@/data/fieldNotes";

export interface LetterPhysicsState {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  zIndex: number;
  isDragging: boolean;
}

export interface LetterPhysicsControls {
  startDrag: (id: string, clientX: number, clientY: number, pointerType: string) => void;
  drag: (id: string, clientX: number, clientY: number) => void;
  endDrag: (id: string) => { moved: boolean; velocity: { x: number; y: number }; speed?: number };
  reducedMotion: boolean;
}

interface DragSession {
  id: string;
  offsetX: number;
  offsetY: number;
  pointerType: string;
  samples: Array<{ x: number; y: number; time: number }>;
}

const TABLE_FALLBACK = { width: 1100, height: 720 };
const MAX_THROW = 18;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getScale(width: number) {
  return clamp(width / 1120, 0.62, 1.04);
}

function getLetterSize(note: FieldNoteRecord, tableWidth: number) {
  const theme = letterStyleThemes[note.letterStyle];
  const scale = getScale(tableWidth);

  return {
    width: Math.round(theme.width * scale),
    height: Math.round(theme.height * scale),
  };
}

function localPoint(container: HTMLElement | null, clientX: number, clientY: number) {
  const rect = container?.getBoundingClientRect();

  return {
    x: clientX - (rect?.left ?? 0),
    y: clientY - (rect?.top ?? 0),
  };
}

function buildInitialStates(notes: FieldNoteRecord[], width: number, height: number) {
  const tableWidth = width || TABLE_FALLBACK.width;
  const tableHeight = height || TABLE_FALLBACK.height;

  return Object.fromEntries(
    notes.map((note) => {
      const size = getLetterSize(note, tableWidth);
      const x = (note.tablePosition.x / 100) * tableWidth;
      const y = (note.tablePosition.y / 100) * tableHeight;

      return [
        note.id,
        {
          x,
          y,
          width: size.width,
          height: size.height,
          angle: degToRad(note.rotation),
          zIndex: note.stackLayer,
          isDragging: false,
        },
      ];
    }),
  ) as Record<string, LetterPhysicsState>;
}

function velocityFromSamples(samples: DragSession["samples"]) {
  const latest = samples.at(-1);
  const previous = [...samples].reverse().find((sample) => latest && latest.time - sample.time > 24) ?? samples.at(0);

  if (!latest || !previous || latest.time === previous.time) {
    return { x: 0, y: 0 };
  }

  const elapsed = latest.time - previous.time;

  return {
    x: (latest.x - previous.x) / elapsed,
    y: (latest.y - previous.y) / elapsed,
  };
}

export function useLetterPhysics(notes: FieldNoteRecord[]) {
  const tableRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Map<string, Matter.Body>>(new Map());
  const dragRef = useRef<DragSession | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeDragIdRef = useRef<string | null>(null);
  const [tableSize, setTableSize] = useState(TABLE_FALLBACK);
  const [states, setStates] = useState<Record<string, LetterPhysicsState>>(() =>
    buildInitialStates(notes, TABLE_FALLBACK.width, TABLE_FALLBACK.height),
  );
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    activeDragIdRef.current = activeDragId;
  }, [activeDragId]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = tableRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(320, Math.round(entry.contentRect.width));
      const height = Math.max(420, Math.round(entry.contentRect.height));
      setTableSize({ width, height });
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setStates(buildInitialStates(notes, tableSize.width, tableSize.height));
  }, [notes, tableSize.height, tableSize.width]);

  useEffect(() => {
    if (reducedMotion || tableSize.width <= 0 || tableSize.height <= 0) return;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
      enableSleeping: true, // settled letters cost nothing
    });
    const world = engine.world;
    const bodies = new Map<string, Matter.Body>();
    const wallPad = 220;
    const walls = [
      Matter.Bodies.rectangle(tableSize.width / 2, -wallPad / 2, tableSize.width + wallPad * 2, wallPad, {
        isStatic: true,
      }),
      Matter.Bodies.rectangle(tableSize.width / 2, tableSize.height + wallPad / 2, tableSize.width + wallPad * 2, wallPad, {
        isStatic: true,
      }),
      Matter.Bodies.rectangle(-wallPad / 2, tableSize.height / 2, wallPad, tableSize.height + wallPad * 2, {
        isStatic: true,
      }),
      Matter.Bodies.rectangle(tableSize.width + wallPad / 2, tableSize.height / 2, wallPad, tableSize.height + wallPad * 2, {
        isStatic: true,
      }),
    ];

    notes.forEach((note) => {
      const size = getLetterSize(note, tableSize.width);
      const body = Matter.Bodies.rectangle(
        (note.tablePosition.x / 100) * tableSize.width,
        (note.tablePosition.y / 100) * tableSize.height,
        size.width,
        size.height,
        {
          // paper on waxed wood: low surface friction so throws glide, gentle
          // air drag for a natural settle, a touch of bounce off neighbours
          chamfer: { radius: 10 },
          density: 0.0028,
          friction: 0.32,
          frictionAir: 0.055,
          restitution: 0.14,
          label: note.id,
        },
      );

      Matter.Body.setAngle(body, degToRad(note.rotation));
      bodies.set(note.id, body);
    });

    Matter.Composite.add(world, [...walls, ...bodies.values()]);
    engineRef.current = engine;
    bodiesRef.current = bodies;

    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);

      let awake = false;
      bodies.forEach((body) => {
        if (Math.abs(body.velocity.x) > MAX_THROW || Math.abs(body.velocity.y) > MAX_THROW) {
          Matter.Body.setVelocity(body, {
            x: clamp(body.velocity.x, -MAX_THROW, MAX_THROW),
            y: clamp(body.velocity.y, -MAX_THROW, MAX_THROW),
          });
        }

        if (Math.abs(body.angularVelocity) > 0.18) {
          Matter.Body.setAngularVelocity(body, clamp(body.angularVelocity, -0.18, 0.18));
        }

        if (!body.isSleeping) awake = true;
      });

      // whole table at rest and nothing held → skip the React commit entirely
      if (!awake && !activeDragIdRef.current) {
        rafRef.current = window.requestAnimationFrame(update);
        return;
      }

      setStates((current) => {
        const next: Record<string, LetterPhysicsState> = { ...current };

        notes.forEach((note) => {
          const body = bodies.get(note.id);
          if (!body) return;
          const size = getLetterSize(note, tableSize.width);

          next[note.id] = {
            x: body.position.x,
            y: body.position.y,
            width: size.width,
            height: size.height,
            angle: body.angle,
            zIndex: activeDragIdRef.current === note.id ? 1000 : note.stackLayer,
            isDragging: activeDragIdRef.current === note.id,
          };
        });

        return next;
      });

      rafRef.current = window.requestAnimationFrame(update);
    };

    rafRef.current = window.requestAnimationFrame(update);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      Matter.Composite.clear(world, false, true);
      Matter.Engine.clear(engine);
      bodies.clear();
      engineRef.current = null;
      bodiesRef.current = new Map();
    };
  }, [notes, reducedMotion, tableSize.height, tableSize.width]);

  const startDrag = useCallback(
    (id: string, clientX: number, clientY: number, pointerType: string) => {
      const point = localPoint(tableRef.current, clientX, clientY);
      const body = bodiesRef.current.get(id);
      const state = states[id];

      dragRef.current = {
        id,
        offsetX: point.x - (body?.position.x ?? state?.x ?? 0),
        offsetY: point.y - (body?.position.y ?? state?.y ?? 0),
        pointerType,
        samples: [{ x: point.x, y: point.y, time: performance.now() }],
      };
      setActiveDragId(id);

      if (body) {
        Matter.Sleeping.set(body, false); // grabbing always wakes the letter
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(body, 0);
      }
    },
    [states],
  );

  const drag = useCallback(
    (id: string, clientX: number, clientY: number) => {
      const session = dragRef.current;
      if (!session || session.id !== id) return;

      const point = localPoint(tableRef.current, clientX, clientY);
      const nextX = point.x - session.offsetX;
      const nextY = point.y - session.offsetY;
      const now = performance.now();

      session.samples = [...session.samples.slice(-5), { x: point.x, y: point.y, time: now }];

      if (reducedMotion) {
        setStates((current) => ({
          ...current,
          [id]: {
            ...current[id],
            x: clamp(nextX, 30, tableSize.width - 30),
            y: clamp(nextY, 40, tableSize.height - 40),
            zIndex: 1000,
            isDragging: true,
          },
        }));
        return;
      }

      const body = bodiesRef.current.get(id);
      if (!body) return;
      const velocity = velocityFromSamples(session.samples);

      Matter.Body.setPosition(body, {
        x: clamp(nextX, 0, tableSize.width),
        y: clamp(nextY, 0, tableSize.height),
      });
      Matter.Body.setVelocity(body, {
        x: clamp(velocity.x * 12, -MAX_THROW, MAX_THROW),
        y: clamp(velocity.y * 12, -MAX_THROW, MAX_THROW),
      });
      Matter.Body.setAngularVelocity(body, clamp((velocity.x - velocity.y) * 0.028, -0.12, 0.12));
    },
    [reducedMotion, tableSize.height, tableSize.width],
  );

  const endDrag = useCallback(
    (id: string) => {
      const session = dragRef.current;
      if (!session || session.id !== id) return { moved: false, velocity: { x: 0, y: 0 } };

      const velocity = velocityFromSamples(session.samples);
      const speed = Math.hypot(velocity.x, velocity.y);
      const body = bodiesRef.current.get(id);
      const throwScale = session.pointerType === "touch" ? 7 : 14;
      const moved = session.samples.some((sample) => {
        const start = session.samples[0];
        return Math.hypot(sample.x - start.x, sample.y - start.y) > 8;
      });

      if (body && !reducedMotion) {
        Matter.Body.setVelocity(body, {
          x: clamp(velocity.x * throwScale, -MAX_THROW, MAX_THROW),
          y: clamp(velocity.y * throwScale, -MAX_THROW, MAX_THROW),
        });
        Matter.Body.setAngularVelocity(body, clamp((velocity.x - velocity.y) * 0.035, -0.16, 0.16));
      }

      if (reducedMotion) {
        setStates((current) => ({
          ...current,
          [id]: {
            ...current[id],
            zIndex: notes.find((note) => note.id === id)?.stackLayer ?? current[id]?.zIndex ?? 1,
            isDragging: false,
          },
        }));
      }

      dragRef.current = null;
      setActiveDragId(null);

      return { moved, velocity: { x: velocity.x, y: velocity.y }, speed };
    },
    [notes, reducedMotion],
  );

  const controls: LetterPhysicsControls = useMemo(
    () => ({
      startDrag,
      drag,
      endDrag,
      reducedMotion,
    }),
    [drag, endDrag, reducedMotion, startDrag],
  );

  return {
    tableRef,
    states,
    controls,
  };
}
