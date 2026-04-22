import { svgPathProperties } from "svg-path-properties";
import type { SignaturePath, StrokePoint } from "../types";

export type StrokeToPathOptions = {
  simplifyTolerance?: number;
};

export type StrokePathResult = SignaturePath & {
  points: StrokePoint[];
};

const DEFAULT_SIMPLIFY_TOLERANCE = 1.25;

/**
 * Converts freehand points into a smooth SVG path that can be replayed later.
 *
 * @param points Input points captured from a pointer or touch interaction.
 * @param options Optional smoothing configuration.
 * @returns A normalized path string, measured length, and filtered points.
 *
 * @example
 * const result = strokeToPath(points);
 * console.log(result.d);
 */
export function strokeToPath(
  points: StrokePoint[],
  options: StrokeToPathOptions = {},
): StrokePathResult {
  const deduped = dedupePoints(points);
  const smoothed = smoothPoints(deduped);
  const simplified = simplifyPoints(
    smoothed,
    options.simplifyTolerance ?? DEFAULT_SIMPLIFY_TOLERANCE,
  );
  const d = buildSmoothPath(simplified);

  return {
    d,
    length: d ? new svgPathProperties(d).getTotalLength() : 0,
    points: simplified,
  };
}

function dedupePoints(points: StrokePoint[]): StrokePoint[] {
  return points.filter((point, index) => {
    if (index === 0) {
      return true;
    }

    const previousPoint = points[index - 1];
    if (!previousPoint) {
      return true;
    }

    return previousPoint.x !== point.x || previousPoint.y !== point.y;
  });
}

function smoothPoints(points: StrokePoint[]): StrokePoint[] {
  if (points.length < 3) {
    return points;
  }

  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) {
      return point;
    }

    const previousPoint = points[index - 1];
    const nextPoint = points[index + 1];

    if (!previousPoint || !nextPoint) {
      return point;
    }

    return {
      ...point,
      x: round(previousPoint.x * 0.2 + point.x * 0.6 + nextPoint.x * 0.2),
      y: round(previousPoint.y * 0.2 + point.y * 0.6 + nextPoint.y * 0.2),
    };
  });
}

function simplifyPoints(points: StrokePoint[], tolerance: number): StrokePoint[] {
  if (points.length < 3 || tolerance <= 0) {
    return points;
  }

  const firstPoint = points[0];

  if (!firstPoint) {
    return [];
  }

  const simplified: StrokePoint[] = [firstPoint];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previousPoint = simplified[simplified.length - 1];
    const currentPoint = points[index];

    if (!previousPoint || !currentPoint) {
      continue;
    }

    const distance = Math.hypot(currentPoint.x - previousPoint.x, currentPoint.y - previousPoint.y);

    if (distance >= tolerance) {
      simplified.push(currentPoint);
    }
  }

  const lastPoint = points[points.length - 1];

  if (lastPoint && simplified[simplified.length - 1] !== lastPoint) {
    simplified.push(lastPoint);
  }

  return simplified;
}

function buildSmoothPath(points: StrokePoint[]): string {
  if (points.length === 0) {
    return "";
  }

  const firstPoint = points[0];

  if (!firstPoint) {
    return "";
  }

  if (points.length === 1) {
    return `M ${firstPoint.x} ${firstPoint.y}`;
  }

  if (points.length === 2) {
    const secondPoint = points[1];

    if (!secondPoint) {
      return `M ${firstPoint.x} ${firstPoint.y}`;
    }

    return `M ${firstPoint.x} ${firstPoint.y} L ${secondPoint.x} ${secondPoint.y}`;
  }

  let path = `M ${firstPoint.x} ${firstPoint.y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previousPoint = points[index - 1] ?? points[index];
    const currentPoint = points[index];
    const nextPoint = points[index + 1];
    const followingPoint = points[index + 2] ?? nextPoint;

    if (!previousPoint || !currentPoint || !nextPoint || !followingPoint) {
      continue;
    }

    const controlPoint1X = round(currentPoint.x + (nextPoint.x - previousPoint.x) / 6);
    const controlPoint1Y = round(currentPoint.y + (nextPoint.y - previousPoint.y) / 6);
    const controlPoint2X = round(nextPoint.x - (followingPoint.x - currentPoint.x) / 6);
    const controlPoint2Y = round(nextPoint.y - (followingPoint.y - currentPoint.y) / 6);

    path += ` C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${nextPoint.x} ${nextPoint.y}`;
  }

  return path;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
