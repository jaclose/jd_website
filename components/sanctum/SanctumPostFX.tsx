"use client";
import {
  Bloom,
  BrightnessContrast,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import type { QualityConfig } from "./SanctumQualityManager";

/**
 * Restrained, filmic post — ACES tone mapping is on the renderer; here we add a
 * subtle bloom, SMAA, a gentle grade and a held-back vignette, plus depth of
 * field used *only* during transitions/inspection (never as a permanent blur).
 * No chromatic aberration, no grain. Grounded and sacred, not a nightclub.
 * Disabled entirely on the low tier.
 */
export default function SanctumPostFX({
  config,
  dofActive,
}: {
  config: QualityConfig;
  dofActive: boolean;
}) {
  if (!config.postfx) return null;
  const useDof = config.dof && dofActive;
  const effects: React.ReactElement[] = [
    <Bloom key="bloom" intensity={0.5} luminanceThreshold={0.62} luminanceSmoothing={0.4} mipmapBlur />,
    ...(useDof
      ? [<DepthOfField key="dof" focusDistance={0.015} focalLength={0.03} bokehScale={2.2} height={480} />]
      : []),
    <SMAA key="smaa" />,
    <HueSaturation key="hue" saturation={-0.06} hue={0} />,
    <BrightnessContrast key="bc" brightness={-0.02} contrast={0.1} />,
    <Vignette key="vig" eskil={false} offset={0.28} darkness={0.62} />,
  ];
  return <EffectComposer multisampling={0}>{effects}</EffectComposer>;
}
