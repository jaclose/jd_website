"use client";
import { useEffect } from "react";
import { unlockVisitor } from "@/lib/visitor";

/** quietly grants a visitor achievement for arriving somewhere */
export default function UnlockOnMount({ id }: { id: string }) {
  useEffect(() => {
    unlockVisitor(id);
  }, [id]);
  return null;
}
