import { svgPathProperties } from "svg-path-properties";
import type { PathMetricSegment, PathMetrics } from "../types";

/**
 * Measures one or more SVG path strings so each stroke can be revealed
 * proportionally during playback.
 *
 * @param paths Raw SVG path strings in draw order.
 * @returns Total length and normalized start/end ranges for each segment.
 *
 * @example
 * const metrics = getPathMetrics(["M 0 0 L 100 0"]);
 * console.log(metrics.totalLength);
 */
export function getPathMetrics(paths: string[]): PathMetrics {
  const measuredSegments = paths.map<PathMetricSegment>((d) => ({
    d,
    length: d ? new svgPathProperties(d).getTotalLength() : 0,
    start: 0,
    end: 0,
  }));

  const totalLength = measuredSegments.reduce(
    (sum, segment) => sum + segment.length,
    0,
  );

  if (totalLength === 0) {
    return {
      totalLength: 0,
      segments: measuredSegments.map((segment, index, segments) => ({
        ...segment,
        start: index === 0 ? 0 : 1,
        end: index === segments.length - 1 ? 1 : 1,
      })),
    };
  }

  let cursor = 0;
  const segments = measuredSegments.map((segment) => {
    const start = cursor / totalLength;
    cursor += segment.length;

    return {
      ...segment,
      start,
      end: cursor / totalLength,
    };
  });

  return {
    totalLength,
    segments,
  };
}
