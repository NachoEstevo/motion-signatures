import { describe, expect, it } from "vitest";
import { strokeToPath } from "@signature/react-internal/vectorize/strokeToPath";
import type { StrokePoint } from "@signature/react-internal/types";

describe("strokeToPath", () => {
  it("creates a minimal SVG path for a short stroke", () => {
    // Arrange
    const points: StrokePoint[] = [
      { x: 8, y: 12, time: 0 },
      { x: 40, y: 24, time: 16 },
      { x: 88, y: 36, time: 32 },
    ];

    // Act
    const result = strokeToPath(points, { simplifyTolerance: 0 });

    // Assert
    expect(result.d.startsWith("M 8 12")).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.points).toHaveLength(3);
  });

  it("drops repeated points before building the path", () => {
    // Arrange
    const points: StrokePoint[] = [
      { x: 10, y: 10, time: 0 },
      { x: 10, y: 10, time: 5 },
      { x: 40, y: 30, time: 10 },
      { x: 80, y: 45, time: 15 },
    ];

    // Act
    const result = strokeToPath(points, { simplifyTolerance: 0 });

    // Assert
    expect(result.points).toHaveLength(3);
    expect(result.d).not.toContain("M 10 10 L 10 10");
  });

  it("smooths jittery hand-drawn input before generating the SVG path", () => {
    // Arrange
    const points: StrokePoint[] = [
      { x: 0, y: 0, time: 0 },
      { x: 10, y: 14, time: 16 },
      { x: 20, y: -12, time: 32 },
      { x: 30, y: 12, time: 48 },
      { x: 40, y: 0, time: 64 },
    ];

    // Act
    const result = strokeToPath(points, { simplifyTolerance: 0 });

    // Assert
    expect(result.points[2]?.y).not.toBe(-12);
    expect(result.d).toContain("C");
  });
});
