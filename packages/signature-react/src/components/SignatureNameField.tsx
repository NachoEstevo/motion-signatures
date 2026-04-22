import { useState } from "react";
import { nameToPath, type FontLike } from "../vectorize/nameToPath";
import type { SignatureVector } from "../types";

export type SignatureNameFieldProps = {
  onChange?: (signature: SignatureVector) => void;
  loadFont?: () => Promise<FontLike>;
};

/**
 * Collects a typed name and converts it into an SVG signature on demand.
 *
 * @param props Change callback and optional font loader override.
 * @returns A compact form for generating typed signature vectors.
 *
 * @example
 * <SignatureNameField onChange={(signature) => console.log(signature.paths[0]?.d)} />
 */
export function SignatureNameField({
  onChange,
  loadFont,
}: SignatureNameFieldProps) {
  const [value, setValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate(): Promise<void> {
    if (!value.trim()) {
      setErrorMessage("Enter a name before generating the signature.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const signature = await nameToPath(value, { loadFont });
      onChange?.(signature);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to generate the signature.",
      );
    } finally {
      setIsGenerating(false);
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
          disabled={isGenerating}
          onClick={() => {
            void handleGenerate();
          }}
          style={{
            border: "none",
            borderRadius: "999px",
            padding: "0.7rem 1.1rem",
            background: "#0f172a",
            color: "#f8fafc",
            cursor: isGenerating ? "progress" : "pointer",
            fontWeight: 600,
            opacity: isGenerating ? 0.72 : 1,
          }}
          type="button"
        >
          {isGenerating ? "Generating..." : "Generate signature"}
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
