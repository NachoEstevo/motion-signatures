import { useState } from "react";
import type { FontLike } from "../vectorize/nameToPath";
import type { SignatureVector } from "../types";
import { AnimatedSignatureCard } from "./AnimatedSignatureCard";
import { SignatureNameField } from "./SignatureNameField";

export type TypedSignatureCardProps = {
  loadFont?: () => Promise<FontLike>;
  restartToken?: number;
  durationMs?: number;
};

/**
 * Combines typed-name capture with the animated preview card.
 * The typed signature is replayed as a sequential stroke trace so
 * each glyph appears in a handwriting-like cadence inside the studio.
 *
 * @param props Optional font loader override and animation timing.
 * @returns A complete typed-signature generation flow.
 *
 * @example
 * <TypedSignatureCard durationMs={1800} />
 */
export function TypedSignatureCard({
  loadFont,
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
      <SignatureNameField loadFont={loadFont} onChange={setSignature} />
      <AnimatedSignatureCard
        description="Generate a signature-style SVG from a typed name and replay its trace."
        durationMs={durationMs}
        renderMode="stroke"
        restartToken={restartToken}
        signature={signature}
        title="Typed signature"
      />
    </div>
  );
}
