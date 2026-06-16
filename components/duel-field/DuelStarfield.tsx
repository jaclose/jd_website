"use client";

import { useEffect, useRef, useState } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  brightness: number;
  targetBrightness: number;
  size: number;
  color: string;
  twinklePeriod: number;
  twinkling: number;
}

interface DuelStarfieldProps {
  active?: boolean;
  mouseX?: number;
  mouseY?: number;
}

export function DuelStarfield({ active = false, mouseX = 0, mouseY = 0 }: DuelStarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const [quality, setQuality] = useState<"high" | "medium" | "low">("high");

  useEffect(() => {
    // Detect performance tier
    const perfTier = /android|webos|iphone|ipad|ipod/i.test(navigator.userAgent)
      ? "low"
      : window.innerWidth < 768
        ? "medium"
        : "high";
    setQuality(perfTier as "high" | "medium" | "low");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Star count based on quality
    const starCount = reducedMotion ? 180 : quality === "high" ? 700 : quality === "medium" ? 400 : 200;

    // Initialize stars if empty
    if (starsRef.current.length === 0) {
      const colors = ["#A0ECFF", "#C3A6FF", "#F2C879"];
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 100,
          vx: reducedMotion ? 0 : (Math.random() - 0.5) * 0.18,
          vy: reducedMotion ? 0 : (Math.random() - 0.5) * 0.18,
          vz: reducedMotion ? 0 : (Math.random() - 0.5) * 0.24,
          brightness: Math.random() * 0.45 + 0.25,
          targetBrightness: Math.random() * 0.45 + 0.25,
          size: Math.random() * 1.85 + 0.75,
          color: colors[Math.floor(Math.random() * colors.length)],
          twinklePeriod: Math.random() * 4500 + 5500,
          twinkling: Math.random() * Math.PI * 2,
        });
      }
    }

    const stars = starsRef.current;

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      frameCount++;

      // Clear with deep space color
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Update and draw stars
      stars.forEach((star) => {
        // Drift
        star.x += star.vx;
        star.y += star.vy;
        star.z += star.vz;

        // Wrap around edges
        if (star.x < -50) star.x = w + 50;
        if (star.x > w + 50) star.x = -50;
        if (star.y < -50) star.y = h + 50;
        if (star.y > h + 50) star.y = -50;

        // Slow twinkle via sine wave.
        star.twinkling += reducedMotion ? 0 : (Math.PI * 2) / (star.twinklePeriod / 16);
        if (star.twinkling > Math.PI * 2) star.twinkling -= Math.PI * 2;
        const twinkle = reducedMotion ? 0.9 : Math.sin(star.twinkling) * 0.12 + 0.82;

        // Cursor attraction (if mouse position provided and active)
        if (!reducedMotion && active && mouseX !== 0 && mouseY !== 0) {
          const dx = mouseX - star.x;
          const dy = mouseY - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 240;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 0.08;
            star.vx += (dx / dist) * force;
            star.vy += (dy / dist) * force;
          }
        }

        // Apply damping
        star.vx *= 0.99;
        star.vy *= 0.99;

        // Draw star
        const finalBrightness = star.brightness * twinkle;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = finalBrightness;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect for brighter stars
        if (finalBrightness > 0.5) {
          ctx.fillStyle = star.color;
          ctx.globalAlpha = finalBrightness * 0.3;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      });

      // Draw stable subtle connections between nearby stars.
      if (!reducedMotion && quality === "high") {
        ctx.strokeStyle = "rgba(160, 236, 255, 0.18)";
        ctx.lineWidth = 0.75;
        ctx.setLineDash([4, 14]);

        stars.forEach((star, i) => {
          for (let j = i + 1; j < Math.min(i + 6, stars.length); j++) {
            if (((i * 17 + j * 31) % 100) > 8) continue;
            const other = stars[j];
            const dx = other.x - star.x;
            const dy = other.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 95) {
              ctx.globalAlpha = (1 - dist / 95) * 0.28;
              ctx.beginPath();
              ctx.moveTo(star.x, star.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        });

        ctx.setLineDash([]);
      }

      // Add nebula layers (subtle gradients)
      if (frameCount % 2 === 0) {
        const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
        grd.addColorStop(0, "rgba(100, 80, 180, 0.04)");
        grd.addColorStop(0.5, "rgba(60, 120, 200, 0.02)");
        grd.addColorStop(1, "rgba(20, 30, 60, 0.06)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newW = canvas.offsetWidth * dpr;
      const newH = canvas.offsetHeight * dpr;
      if (newW !== canvas.width || newH !== canvas.height) {
        canvas.width = newW;
        canvas.height = newH;
        ctx.scale(dpr, dpr);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, quality, mouseX, mouseY]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
