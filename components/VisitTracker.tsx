"use client";
import { useEffect } from "react";
import { registerVisit } from "@/lib/visitor";

/** records the visit once per load — powers night-owl & return-traveler */
export default function VisitTracker() {
  useEffect(() => {
    registerVisit();
  }, []);
  return null;
}
