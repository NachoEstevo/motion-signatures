import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TypedSignatureCard } from "@signature/react-internal/components/TypedSignatureCard";
import {
  type FontLike,
  type GlyphLike,
} from "@signature/react-internal/vectorize/nameToPath";

const glyphs: GlyphLike[] = [
  {
    advanceWidth: 320,
    getPath: (x: number, y: number, fontSize: number) => ({
      toPathData: () =>
        `M ${x} ${y} C ${x + fontSize * 0.1} ${y - fontSize * 0.5} ${x + fontSize * 0.28} ${y - fontSize * 0.62} ${x + fontSize * 0.44} ${y - fontSize * 0.08}`,
      getBoundingBox: () => ({
        x1: x,
        y1: y - fontSize * 0.62,
        x2: x + fontSize * 0.44,
        y2: y,
      }),
    }),
  },
  {
    advanceWidth: 280,
    getPath: (x: number, y: number, fontSize: number) => ({
      toPathData: () =>
        `M ${x} ${y - fontSize * 0.08} C ${x + fontSize * 0.12} ${y - fontSize * 0.58} ${x + fontSize * 0.24} ${y - fontSize * 0.24} ${x + fontSize * 0.4} ${y - fontSize * 0.12}`,
      getBoundingBox: () => ({
        x1: x,
        y1: y - fontSize * 0.58,
        x2: x + fontSize * 0.4,
        y2: y - fontSize * 0.08,
      }),
    }),
  },
];

const loadGlyphFont = async (): Promise<FontLike> => ({
  getPath: () => ({
    toPathData: () => "M 0 0 C 20 0 40 30 70 30",
    getBoundingBox: () => ({
      x1: 0,
      y1: 0,
      x2: 70,
      y2: 30,
    }),
  }),
  unitsPerEm: 1000,
  getKerningValue: () => 0,
  stringToGlyphs: () => glyphs,
});

describe("TypedSignatureCard", () => {
  it("connects typed input to the animated preview card", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <TypedSignatureCard
        loadFont={loadGlyphFont}
      />,
    );

    // Act
    await user.type(screen.getByLabelText("Type your name"), "Nacho");
    await user.click(screen.getByRole("button", { name: "Generate signature" }));

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("signature-stroke")).toHaveLength(2);
    });
  });

  it("uses a left-to-right fill reveal for generated typed signatures in the studio preview", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <TypedSignatureCard
        loadFont={loadGlyphFont}
      />,
    );

    // Act
    await user.type(screen.getByLabelText("Type your name"), "Nacho");
    await user.click(screen.getByRole("button", { name: "Generate signature" }));

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("signature-stroke")).toHaveLength(2);
    });
    expect(screen.getAllByTestId("signature-fill-segment")).toHaveLength(2);
  });
});
