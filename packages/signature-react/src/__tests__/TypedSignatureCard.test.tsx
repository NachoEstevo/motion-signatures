import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TypedSignatureCard } from "@signature/react-internal/components/TypedSignatureCard";
import type { StrokeFont } from "@signature/react-internal/vectorize/nameToStrokePath";

const testFont: StrokeFont = {
  name: "Test",
  unitsPerEm: 1000,
  ascent: 800,
  descent: -200,
  defaultAdvance: 500,
  glyphs: {
    A: { advance: 540, d: "M 40 0 L 270 700 L 500 0 M 120 220 L 420 220" },
    B: { advance: 500, d: "M 40 0 L 40 700 L 340 700 L 420 500 L 340 360 L 40 360 L 420 180 L 320 0 L 40 0" },
    C: { advance: 480, d: "M 440 600 C 360 720 180 720 80 580 C -20 440 -20 260 80 120 C 180 -20 360 -20 440 100" },
  },
};

describe("TypedSignatureCard", () => {
  it("draws one stroke path per typed glyph", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TypedSignatureCard font={testFont} />);

    // Act
    await user.type(screen.getByLabelText("Type your name"), "AB");
    await user.click(screen.getByRole("button", { name: "Generate signature" }));

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("signature-stroke")).toHaveLength(2);
    });
  });

  it("renders generated typed signatures in stroke mode rather than fill reveal", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TypedSignatureCard font={testFont} />);

    // Act
    await user.type(screen.getByLabelText("Type your name"), "ABC");
    await user.click(screen.getByRole("button", { name: "Generate signature" }));

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("signature-stroke")).toHaveLength(3);
    });
    expect(screen.queryAllByTestId("signature-fill-segment")).toHaveLength(0);
  });
});
