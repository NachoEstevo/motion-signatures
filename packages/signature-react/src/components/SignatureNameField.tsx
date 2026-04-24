import { useState } from "react";
import {
  nameToStrokePath,
  type StrokeFont,
} from "../vectorize/nameToStrokePath";
import type { SignatureVector } from "../types";

export type SignatureNameFieldProps = {
  onChange?: (signature: SignatureVector) => void;
  font?: StrokeFont;
};

/**
 * Collects a typed name and converts it into a single-stroke SVG signature
 * ready to be animated as if written by hand.
 *
 * @param props Change callback and optional single-line font override.
 * @returns A compact form for generating typed signature vectors.
 *
 * @example
 * <SignatureNameField onChange={(signature) => console.log(signature.paths.length)} />
 */
export function SignatureNameField({
  onChange,
  font,
}: SignatureNameFieldProps) {
  const [value, setValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleGenerate(): void {
    if (!value.trim()) {
      setErrorMessage("Enter a name before generating the signature.");
      return;
    }

    setErrorMessage("");

    try {
      const signature = nameToStrokePath(value, { font });
      onChange?.(signature);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to generate the signature.",
      );
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
      }}
    >
      <label
        style={{
          display: "grid",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontWeight: 600, color: "#0f172a" }}>Type your name</span>
        <input
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. Nacho Garcia"
          style={{
            border: "1px solid rgba(15, 23, 42, 0.12)",
            borderRadius: "16px",
            padding: "0.85rem 1rem",
            fontSize: "1rem",
            background: "#f7f4ee",
          }}
          type="text"
          value={value}
        />
      </label>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <button
          onClick={handleGenerate}
          style={{
            border: "none",
            borderRadius: "999px",
            padding: "0.7rem 1.1rem",
            background: "#0f172a",
            color: "#f8fafc",
            cursor: "pointer",
            fontWeight: 600,
          }}
          type="button"
        >
          Generate signature
        </button>
        {errorMessage ? (
          <span role="alert" style={{ color: "#b91c1c" }}>
            {errorMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
