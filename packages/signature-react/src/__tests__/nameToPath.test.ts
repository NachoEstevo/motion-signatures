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
