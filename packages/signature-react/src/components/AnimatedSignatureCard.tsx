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

type StrokePlaybackEase = "none" | "power1.inOut" | "power2.out" | "power3.out";

type StrokePlaybackSegment = {
  start: number;
  end: number;
  ease: StrokePlaybackEase;
};

export type StrokeTimelineEntry = {
  offsetSec: number;
  durationSec: number;
  ease: StrokePlaybackEase;
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
  const lastIndex = segments.length - 1;
  return segments.map((segment, index) => ({
    ...segment,
    ease: index === lastIndex ? "power3.out" : "none",
  }));
}

const FINAL_STROKE_WEIGHT = 1.45;

/**
 * Arranges stroke segments sequentially in time with pen-lift pauses between
 * glyphs so the replay reads like a hand writing each letter in turn.
 *
 * The last stroke gets a slightly enlarged time slice and no leading gap, so
 * motion flows continuously into a pronounced ease-out at the end.
 * Gaps are absorbed from the total duration budget so the caller's durationMs
 * still represents the overall animation length.
 *
 * @param segments Normalized stroke segments (start/end in [0,1]).
 * @param options Total duration and pen-lift gap in seconds.
 * @returns Per-segment absolute offset, draw duration, and easing.
 */
export function layoutStrokeTimeline(
  segments: Array<{ start: number; end: number }>,
  options: { durationSec: number; gapSec: number },
): StrokeTimelineEntry[] {
  const eased = getStrokePlaybackSegments(segments);
  const lastIndex = segments.length - 1;
  const gapCount = Math.max(0, segments.length - 2);
  const totalGap = gapCount * options.gapSec;
  const minDrawShare = options.durationSec * 0.7;
  const drawBudget = Math.max(options.durationSec - totalGap, minDrawShare);

  const weightedProportions = segments.map((segment, index) => {
    const raw = Math.max(segment.end - segment.start, 0);
    return index === lastIndex && segments.length > 1
      ? raw * FINAL_STROKE_WEIGHT
      : raw;
  });
  const weightSum = weightedProportions.reduce((sum, value) => sum + value, 0);
  const weightScale = weightSum > 0 ? 1 / weightSum : 0;

  const entries: StrokeTimelineEntry[] = [];
  let cursor = 0;

  segments.forEach((_, index) => {
    const durationSec = Math.max(
      drawBudget * (weightedProportions[index] ?? 0) * weightScale,
      0.08,
    );
    entries.push({
      offsetSec: cursor,
      durationSec,
      ease: eased[index]?.ease ?? "none",
    });
    const isBeforeFinale = index === lastIndex - 1;
    const gapAfter = index < lastIndex && !isBeforeFinale ? options.gapSec : 0;
    cursor += durationSec + gapAfter;
  });

  return entries;
}

function resolveGapSec(durationMs: number, segmentCount: number): number {
  if (segmentCount <= 2) {
    return 0;
  }
  const baseGapMs = 45;
  const maxTotalGapMs = durationMs * 0.2;
  const gapCount = segmentCount - 2;
  const totalGapMs = Math.min(baseGapMs * gapCount, maxTotalGapMs);
  return gapCount > 0 ? totalGapMs / gapCount / 1000 : 0;
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
  const strokeTimeline = useMemo<StrokeTimelineEntry[]>(() => {
    if (!metrics || renderMode !== "stroke") {
      return [];
    }
    const durationSec = Math.max(durationMs / 1000, 0.2);
    const gapSec = resolveGapSec(durationMs, metrics.segments.length);
    return layoutStrokeTimeline(metrics.segments, { durationSec, gapSec });
  }, [durationMs, metrics, renderMode]);
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

      metrics.segments.forEach((segment, index) => {
        const path = pathRefs.current[index];
        const entry = strokeTimeline[index];

        if (!path || !entry) {
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
            duration: entry.durationSec,
            ease: entry.ease,
          },
          entry.offsetSec,
        );
      });
    },
    {
      scope: frameRef,
      dependencies: [metrics, replayToken, durationMs, renderMode, strokeTimeline],
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
                          animationDelay: `${Math.round((strokeTimeline[index]?.offsetSec ?? 0) * 1000)}ms`,
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
