import { describe, expect, it } from "vitest";
import { nameToPath } from "@signature/react-internal/vectorize/nameToPath";

describe("nameToPath", () => {
  it("builds a normalized vector signature from an injected font loader", async () => {
    // Arrange
    const loadFont = async () => ({
      getPath: () => ({
        toPathData: () => "M 0 0 C 20 0 40 40 60 40",
        getBoundingBox: () => ({
          x1: 0,
          y1: 0,
          x2: 60,
          y2: 40,
        }),
      }),
    });

    // Act
    const result = await nameToPath("Nacho", { loadFont });

    // Assert
    expect(result.width).toBe(320);
    expect(result.height).toBe(120);
    expect(result.viewBox).toBe("0 0 320 120");
    expect(result.paths[0]?.d.length).toBeGreaterThan(0);
  });

  it("positions the baseline so glyphs sit within the padded viewBox", async () => {
    // Arrange
    const calls: Array<{ x: number; y: number; fontSize: number }> = [];
    const bounds = { x1: 0, y1: -55, x2: 200, y2: 15 };
    const loadFont = async () => ({
      getPath: (_text: string, x: number, y: number, fontSize: number) => {
        calls.push({ x, y, fontSize });
        return {
          toPathData: () => "M 0 0 L 10 10",
          getBoundingBox: () => bounds,
        };
      },
    });
    const width = 320;
    const height = 120;
    const padding = 16;

    // Act
    await nameToPath("Nacho", { loadFont, width, height, padding });

    // Assert
    const finalCall = calls[1];
    if (!finalCall) {
      throw new Error("Expected nameToPath to request a final path draw");
    }

    const rawWidth = bounds.x2 - bounds.x1;
    const rawHeight = bounds.y2 - bounds.y1;
    const scale = Math.min(
      (width - padding * 2) / rawWidth,
      (height - padding * 2) / rawHeight,
    );

    const topOfGlyph = finalCall.y + bounds.y1 * scale;
    const bottomOfGlyph = finalCall.y + bounds.y2 * scale;

    expect(topOfGlyph).toBeGreaterThanOrEqual(padding - 0.01);
    expect(bottomOfGlyph).toBeLessThanOrEqual(height - padding + 0.01);
  });

  it("rejects blank names before loading the font", async () => {
    // Arrange
    const loadFont = async () => {
      throw new Error("should not load");
    };

    // Act
    const result = nameToPath("   ", { loadFont });

    // Assert
    await expect(result).rejects.toThrow("A name is required");
  });
});
