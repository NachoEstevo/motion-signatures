import { useState } from "react";
import type { StrokeFont } from "../vectorize/nameToStrokePath";
import type { SignatureVector } from "../types";
import { AnimatedSignatureCard } from "./AnimatedSignatureCard";
import { SignatureNameField } from "./SignatureNameField";

export type TypedSignatureCardProps = {
  font?: StrokeFont;
  restartToken?: number;
  durationMs?: number;
};

/**
 * Combines typed-name capture with the animated preview card.
 * The typed signature is drawn stroke-by-stroke using a single-line
 * handwriting font, so each glyph traces itself as if written by hand.
 *
 * @param props Optional font override and animation timing.
 * @returns A complete typed-signature generation flow.
 *
 * @example
 * <TypedSignatureCard durationMs={2400} />
 */
export function TypedSignatureCard({
  font,
  restartToken = 0,
  durationMs,
}: TypedSignatureCardProps) {
  const [signature, setSignature] = useState<SignatureVector | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
      }}
    >
      <SignatureNameField font={font} onChange={setSignature} />
      <AnimatedSignatureCard
        description="Generate a single-stroke signature from a typed name and replay it."
        durationMs={durationMs}
        renderMode="stroke"
        restartToken={restartToken}
        signature={signature}
        title="Typed signature"
      />
    </div>
  );
}
