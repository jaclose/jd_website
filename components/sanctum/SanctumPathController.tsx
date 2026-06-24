"use client";
import { useCallback, useMemo, useState } from "react";
import {
  FIRST_NODE,
  journeyNodeById,
  type JourneyNode,
  type Zone,
} from "./lib/journey";

/**
 * The journey state machine: where the camera is, where it's heading, and what
 * the user can do next (step forward, choose a fork, backtrack, inspect). It maps
 * 1:1 onto the journey graph's `nextNodes`/`previousNode`/`type` — the camera rig
 * only ever receives the current target id. Lives as a hook because it must be
 * shared with the in-canvas rig via props (R3F context doesn't cross the canvas).
 */
export interface JourneyNav {
  currentNodeId: string;
  targetNodeId: string;
  currentNode: JourneyNode;
  targetNode: JourneyNode;
  /** target zone while moving, current zone when settled — drives mood. */
  zone: Zone;
  moving: boolean;
  started: boolean;
  atFork: boolean;
  choices: JourneyNode[];
  /** single forward step when the node isn't a fork (or null at forks/dead-ends). */
  forward: JourneyNode | null;
  back: JourneyNode | null;
  inspectedFeatureId: string | null;
  goTo: (id: string) => void;
  stepForward: () => void;
  arrive: (id: string) => void;
  inspect: (id: string | null) => void;
}

function initialNode(): string {
  if (typeof window === "undefined") return FIRST_NODE;
  // ?sanctumStart=<nodeId> drops the camera at a node (debugging / deep links).
  const id = new URLSearchParams(window.location.search).get("sanctumStart");
  if (id) {
    try {
      journeyNodeById(id);
      return id;
    } catch {
      /* unknown node — ignore */
    }
  }
  return FIRST_NODE;
}

export function useJourneyNav(): JourneyNav {
  const [currentNodeId, setCurrentNodeId] = useState(initialNode);
  const [targetNodeId, setTargetNodeId] = useState(initialNode);
  const [inspectedFeatureId, setInspectedFeatureId] = useState<string | null>(null);

  const currentNode = journeyNodeById(currentNodeId);
  const targetNode = journeyNodeById(targetNodeId);
  const moving = currentNodeId !== targetNodeId;
  const started = currentNodeId !== FIRST_NODE || targetNodeId !== FIRST_NODE;
  const zone: Zone = moving ? targetNode.zone : currentNode.zone;

  const choices = useMemo(
    () => currentNode.nextNodes.map((id) => journeyNodeById(id)),
    [currentNode],
  );
  const atFork = !moving && currentNode.type === "fork";
  const forward = !moving && choices.length === 1 ? choices[0] : null;
  const back = !moving && currentNode.previousNode ? journeyNodeById(currentNode.previousNode) : null;

  const goTo = useCallback((id: string) => {
    journeyNodeById(id); // validate
    setTargetNodeId(id);
    setInspectedFeatureId(null);
  }, []);

  const stepForward = useCallback(() => {
    const node = journeyNodeById(currentNodeId);
    if (node.nextNodes.length === 1) goTo(node.nextNodes[0]);
  }, [currentNodeId, goTo]);

  const arrive = useCallback((id: string) => {
    setCurrentNodeId((prev) => (prev === id ? prev : id));
  }, []);

  return {
    currentNodeId,
    targetNodeId,
    currentNode,
    targetNode,
    zone,
    moving,
    started,
    atFork,
    choices,
    forward,
    back,
    inspectedFeatureId,
    goTo,
    stepForward,
    arrive,
    inspect: setInspectedFeatureId,
  };
}
