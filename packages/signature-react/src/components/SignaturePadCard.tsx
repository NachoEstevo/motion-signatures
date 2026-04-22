import { useState } from "react";
import type { SignatureVector } from "../types";
import { AnimatedSignatureCard } from "./AnimatedSignatureCard";
import { SignaturePad, type SignaturePadProps } from "./SignaturePad";

export type SignaturePadCardProps = Pick<
  SignaturePadProps,
  "height" | "simplifyTolerance" | "width"
> & {
  restartToken?: number;
  durationMs?: number;
};

/**
 * Combines freehand capture with the animated preview card.
 *
 * @param props Drawing surface sizing, smoothing, and animation timing.
 * @returns A complete draw-to-preview signature flow.
 *
 * @example
 * <SignaturePadCard width={360} height={140} durationMs={2200} />
 */
export function SignaturePadCard({
  width,
  height,
  simplifyTolerance,
  restartToken = 0,
  durationMs,
}: SignaturePadCardProps) {
  const [signature, setSignature] = useState<SignatureVector | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
      }}
    >
      <SignaturePad
        height={height}
        onChange={setSignature}
        simplifyTolerance={simplifyTolerance}
        width={width}
      />
      <AnimatedSignatureCard
        description="Capture a finger or stylus signature, convert it to SVG, and replay the trace."
        durationMs={durationMs}
        restartToken={restartToken}
        signature={signature}
        title="Drawn signature"
      />
    </div>
  );
}
