import { useId, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getPathMetrics } from "../animation/getPathMetrics";
import type { SignatureVector } from "../types";
import { SignatureCard } from "./SignatureCard";

gsap.registerPlugin(useGSAP);

export type SignatureRenderMode = "stroke" | "fill";

export type AnimatedSignatureCardProps = {
  signature: SignatureVector | null;
  durationMs?: number;
  title?: string;
  description?: string;
  restartToken?: number;
  renderMode?: SignatureRenderMode;
};

type FillPlaybackSegment = {
  x: number;
  width: number;
  start: number;
  weight: number;
  ease: "none" | "power3.out";
};

type StrokePlaybackSegment = {
  start: number;
  end: number;
  ease: "none" | "power3.out";
};

type ViewBoxRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function parseViewBox(viewBox: string, fallbackWidth: number, fallbackHeight: number): ViewBoxRect {
  const parts = viewBox.trim().split(/\s+/).map((value) => Number(value));
  const [rawX, rawY, rawW, rawH] = parts;
  const x = Number.isFinite(rawX) ? (rawX as number) : 0;
  const y = Number.isFinite(rawY) ? (rawY as number) : 0;
  const width =
    Number.isFinite(rawW) && (rawW as number) > 0
      ? (rawW as number)
      : fallbackWidth;
  const height =
    Number.isFinite(rawH) && (rawH as number) > 0
      ? (rawH as number)
      : fallbackHeight;
  return { x, y, width, height };
}

export function getFillPlaybackSegments(
  segments: Array<{ x: number; width: number }>,
): FillPlaybackSegment[] {
  if (segments.length === 0) {
    return [];
  }

  const minX = Math.min(...segments.map((segment) => segment.x));
  const maxRight = Math.max(...segments.map((segment) => segment.x + segment.width));
  const totalWidth = Math.max(maxRight - minX, 1);

  return segments.map((segment, index) => {
    const fallbackStart = index / segments.length;
    const fallbackWeight = 1 / segments.length;
    const start = (segment.x - minX) / totalWidth;
    const weight = segment.width / totalWidth;

    return {
      ...segment,
      start: Number.isFinite(start) ? start : fallbackStart,
      weight:
        Number.isFinite(weight) && weight > 0
          ? weight
          : fallbackWeight,
      ease: index === segments.length - 1 ? "power3.out" : "none",
    };
  });
}

export function getStrokePlaybackSegments(
  segments: Array<{ start: number; end: number }>,
): StrokePlaybackSegment[] {
  return segments.map((segment, index) => ({
    ...segment,
    ease: index === segments.length - 1 ? "power3.out" : "none",
  }));
}

function buildSignatureSvg(signature: SignatureVector, renderMode: SignatureRenderMode): string {
  const filled = renderMode === "fill";
  const inner = signature.paths
    .map((path) =>
      filled
        ? `<path d="${path.d}" fill="#0f172a"/>`
        : `<path d="${path.d}" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${signature.viewBox}" width="${signature.width}" height="${signature.height}">${inner}</svg>`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

function slugifyFilename(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "signature";
}

async function exportSignaturePng(
  signature: SignatureVector,
  renderMode: SignatureRenderMode,
  filename: string,
): Promise<void> {
  const svgMarkup = buildSignatureSvg(signature, renderMode);
  const image = new Image();
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to render signature PNG."));
    image.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = signature.width;
  canvas.height = signature.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create PNG export context.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Unable to create PNG export blob.");
  }

  downloadBlob(blob, filename);
}

/**
 * Replays one or more SVG signature paths inside a polished preview card.
 *
 * Supports two render modes:
 *   - "stroke": dash-array trace for line-art signatures (default).
 *   - "fill": left-to-right clip reveal for filled glyph outlines (typed names).
 *
 * @param props Signature vector data and optional animation settings.
 * @returns A replayable signature preview card.
 *
 * @example
 * <AnimatedSignatureCard signature={signature} durationMs={1800} renderMode="fill" />
 */
export function AnimatedSignatureCard({
  signature,
  durationMs = 1800,
  title = "Signature preview",
  description = "A clean SVG replay surface for typed and hand-drawn signatures.",
  restartToken = 0,
  renderMode = "stroke",
}: AnimatedSignatureCardProps) {
  const [manualReplayCount, setManualReplayCount] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<SVGPathElement[]>([]);
  const revealRectRefs = useRef<Array<SVGRectElement | null>>([]);
  const clipBaseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const metrics = useMemo(
    () =>
      signature ? getPathMetrics(signature.paths.map((path) => path.d)) : null,
    [signature],
  );

  const replayToken = restartToken + manualReplayCount;

  const viewBoxRect = useMemo<ViewBoxRect | null>(() => {
    if (!signature) {
      return null;
    }
    return parseViewBox(signature.viewBox, signature.width, signature.height);
  }, [signature]);

  const isFill = renderMode === "fill";
  const fillSegments = useMemo(() => {
    if (!signature || !viewBoxRect) {
      return [];
    }

    const segments = signature.paths.map((path, index) => ({
      path,
      bounds: path.bounds ?? viewBoxRect,
      clipId: `signature-reveal-${clipBaseId}-${replayToken}-${index}`,
    }));
    const playback = getFillPlaybackSegments(
      segments.map((segment) => ({ x: segment.bounds.x, width: segment.bounds.width })),
    );

    return segments.map((segment, index) => ({
      ...segment,
      start: playback[index]?.start ?? index / segments.length,
      weight: playback[index]?.weight ?? 1 / segments.length,
      ease: playback[index]?.ease ?? "none",
    }));
  }, [clipBaseId, replayToken, signature, viewBoxRect]);

  useGSAP(
    () => {
      if (!metrics || !signature) {
        return;
      }

      const durationSeconds = Math.max(durationMs / 1000, 0.2);

      if (isFill) {
        if (fillSegments.length === 0) {
          return;
        }

        const timeline = gsap.timeline();

        fillSegments.forEach((segment, index) => {
          const rect = revealRectRefs.current[index];
          if (!rect) {
            return;
          }

          gsap.set(rect, { attr: { width: 0 } });
          timeline.to(
            rect,
            {
              attr: { width: segment.bounds.width },
              duration: Math.max(durationSeconds * segment.weight, 0.22),
              ease: segment.ease,
            },
            segment.start * durationSeconds,
          );
        });
        return;
      }

      const timeline = gsap.timeline();
      const strokePlayback = getStrokePlaybackSegments(metrics.segments);

      metrics.segments.forEach((segment, index) => {
        const path = pathRefs.current[index];

        if (!path) {
          return;
        }

        gsap.set(path, {
          strokeDasharray: segment.length,
          strokeDashoffset: segment.length,
        });

        timeline.to(
          path,
          {
            strokeDashoffset: 0,
            duration: Math.max(durationSeconds * (segment.end - segment.start), 0.08),
            ease: strokePlayback[index]?.ease ?? "none",
          },
          segment.start * durationSeconds,
        );
      });
    },
    {
      scope: frameRef,
      dependencies: [metrics, replayToken, durationMs, renderMode],
      revertOnUpdate: true,
    },
  );

  return (
    <SignatureCard
      actions={
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: "0.65rem",
          }}
        >
          <button
            disabled={!signature}
            onClick={() => setManualReplayCount((currentValue) => currentValue + 1)}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "0.7rem 1rem",
              background: "#0f172a",
              color: "#f8fafc",
              cursor: signature ? "pointer" : "not-allowed",
              opacity: signature ? 1 : 0.48,
              fontWeight: 600,
            }}
            type="button"
          >
            Replay animation
          </button>
          <button
            disabled={!signature}
            onClick={() => {
              if (!signature) {
                return;
              }
              const svgMarkup = buildSignatureSvg(signature, renderMode);
              downloadBlob(
                new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" }),
                `${slugifyFilename(title)}.svg`,
              );
            }}
            style={{
              border: "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: "999px",
              padding: "0.7rem 1rem",
              background: "#ffffff",
              color: "#0f172a",
              cursor: signature ? "pointer" : "not-allowed",
              opacity: signature ? 1 : 0.48,
              fontWeight: 600,
            }}
            type="button"
          >
            Download SVG
          </button>
          <button
            disabled={!signature}
            onClick={() => {
              if (!signature) {
                return;
              }
              void exportSignaturePng(
                signature,
                renderMode,
                `${slugifyFilename(title)}.png`,
              );
            }}
            style={{
              border: "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: "999px",
              padding: "0.7rem 1rem",
              background: "#ffffff",
              color: "#0f172a",
              cursor: signature ? "pointer" : "not-allowed",
              opacity: signature ? 1 : 0.48,
              fontWeight: 600,
            }}
            type="button"
          >
            Download PNG
          </button>
        </div>
      }
      description={description}
      title={title}
    >
      <div
        data-replay-token={replayToken}
        data-testid="signature-frame"
        ref={frameRef}
        style={{
          minHeight: "200px",
          borderRadius: "24px",
          padding: "1rem",
          background: "#f7f4ee",
          border: "1px solid rgba(15, 23, 42, 0.08)",
        }}
      >
        {signature && metrics && viewBoxRect ? (
          <svg
            key={replayToken}
            viewBox={signature.viewBox}
            style={{ width: "100%", height: "100%" }}
          >
            {isFill ? (
              <defs>
                {fillSegments.map((segment, index) => (
                  <clipPath
                    id={segment.clipId}
                    key={segment.clipId}
                    clipPathUnits="userSpaceOnUse"
                  >
                    <rect
                      data-testid="signature-fill-segment"
                      ref={(node) => {
                        revealRectRefs.current[index] = node;
                      }}
                      x={segment.bounds.x}
                      y={segment.bounds.y}
                      width={0}
                      height={segment.bounds.height}
                    />
                  </clipPath>
                ))}
              </defs>
            ) : null}
            {metrics.segments.map((segment, index) => (
              <g
                clipPath={isFill ? `url(#${fillSegments[index]?.clipId})` : undefined}
                key={`${replayToken}-${index}-${segment.d}`}
              >
                <path
                  ref={(node) => {
                    if (node) {
                      pathRefs.current[index] = node;
                    }
                  }}
                  d={segment.d}
                  data-testid="signature-stroke"
                  fill={isFill ? "#0f172a" : "none"}
                  stroke={isFill ? "none" : "#0f172a"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isFill ? undefined : 3}
                  style={
                    isFill
                      ? undefined
                      : {
                          strokeDasharray: `${segment.length}`,
                          strokeDashoffset: `${segment.length}`,
                          animationDelay: `${segment.start * durationMs}ms`,
                        }
                  }
                />
              </g>
            ))}
          </svg>
        ) : (
          <div
            style={{
              minHeight: "168px",
              display: "grid",
              placeItems: "center",
              color: "#64748b",
              fontSize: "1rem",
            }}
          >
            Your signature preview will appear here.
          </div>
        )}
      </div>
    </SignatureCard>
  );
}
