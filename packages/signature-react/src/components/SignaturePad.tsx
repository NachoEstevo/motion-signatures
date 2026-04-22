import { useId } from "react";
import { useSignaturePad } from "../capture/useSignaturePad";
import type { SignatureVector } from "../types";

export type SignaturePadProps = {
  width?: number;
  height?: number;
  onChange?: (signature: SignatureVector | null) => void;
  simplifyTolerance?: number;
};

/**
 * Renders a touch-friendly signature surface backed by SVG path capture.
 *
 * @param props Drawing surface dimensions and change callback.
 * @returns An interactive SVG signature pad with a clear action.
 *
 * @example
 * <SignaturePad onChange={(signature) => console.log(signature)} />
 */
export function SignaturePad({
  width = 320,
  height = 120,
  onChange,
  simplifyTolerance,
}: SignaturePadProps) {
  const titleId = useId();
  const {
    clear,
    committedPaths,
    previewPath,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useSignaturePad({
    width,
    height,
    onChange,
    simplifyTolerance,
  });

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
      }}
    >
      <svg
        aria-labelledby={titleId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: "100%",
          maxWidth: `${width}px`,
          height: "auto",
          borderRadius: "20px",
          border: "1px solid rgba(15, 23, 42, 0.1)",
          background: "#f7f4ee",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
          touchAction: "none",
        }}
      >
        <title id={titleId}>Signature pad</title>
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx="20"
          fill="transparent"
        />
        {committedPaths.map((path) => (
          <path
            key={path}
            d={path}
            fill="none"
            stroke="#0f172a"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ))}
        {previewPath ? (
          <path
            d={previewPath}
            fill="none"
            stroke="#475569"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ) : null}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span
          style={{
            color: "#475569",
            fontSize: "0.95rem",
          }}
        >
          Draw with mouse, stylus, or touch.
        </span>
        <button
          onClick={clear}
          style={{
            border: "none",
            borderRadius: "999px",
            padding: "0.65rem 1rem",
            background: "#0f172a",
            color: "#f8fafc",
            cursor: "pointer",
            fontWeight: 600,
          }}
          type="button"
        >
          Clear signature
        </button>
      </div>
    </div>
  );
}
