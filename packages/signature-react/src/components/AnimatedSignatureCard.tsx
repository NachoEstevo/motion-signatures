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

    return signature.paths.map((path, index) => ({
      path,
      bounds: path.bounds ?? viewBoxRect,
      clipId: `signature-reveal-${clipBaseId}-${replayToken}-${index}`,
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

          const metric = metrics?.segments[index];
          const start = metric?.start ?? index / fillSegments.length;
          const segmentWeight =
            metric?.end && metric?.start !== undefined
              ? metric.end - metric.start
              : 1 / fillSegments.length;

          gsap.set(rect, { attr: { width: 0 } });
          timeline.to(
            rect,
            {
              attr: { width: segment.bounds.width },
              duration: Math.max(durationSeconds * segmentWeight, 0.18),
              ease: "power3.out",
            },
            start * durationSeconds,
          );
        });
        return;
      }

      const timeline = gsap.timeline();

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
            ease: "power3.out",
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
