import { describe, expect, it } from "vitest";
import { getPathMetrics } from "@signature/react-internal/animation/getPathMetrics";

describe("getPathMetrics", () => {
  it("assigns normalized reveal ranges based on each path length", () => {
    // Arrange
    const paths = ["M 0 0 L 100 0", "M 100 0 L 200 0"];

    // Act
    const result = getPathMetrics(paths);

    // Assert
    expect(result.totalLength).toBeCloseTo(200, 0);
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]).toMatchObject({ start: 0, end: 0.5 });
    expect(result.segments[1]).toMatchObject({ start: 0.5, end: 1 });
  });

  it("guards against empty paths by returning zeroed metrics", () => {
    // Arrange
    const paths = [""];

    // Act
    const result = getPathMetrics(paths);

    // Assert
    expect(result.totalLength).toBe(0);
    expect(result.segments[0]).toMatchObject({
      length: 0,
      start: 0,
      end: 1,
    });
  });
});
