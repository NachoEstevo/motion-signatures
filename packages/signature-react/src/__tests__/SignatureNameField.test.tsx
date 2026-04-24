import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignatureNameField } from "@signature/react-internal/components/SignatureNameField";
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
  },
};

describe("SignatureNameField", () => {
  it("converts typed text into a single-stroke signature vector", async () => {
    // Arrange
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<SignatureNameField font={testFont} onChange={handleChange} />);

    // Act
    await user.type(screen.getByLabelText("Type your name"), "AB");
    await user.click(screen.getByRole("button", { name: "Generate signature" }));

    // Assert
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          viewBox: "0 0 320 120",
          paths: expect.arrayContaining([
            expect.objectContaining({
              d: expect.stringMatching(/^M /),
            }),
          ]),
        }),
      );
    });
    const signature = handleChange.mock.calls[0]?.[0];
    expect(signature?.paths.length).toBe(2);
  });

  it("shows a helpful validation message for empty names", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SignatureNameField />);

    // Act
    await user.click(screen.getByRole("button", { name: "Generate signature" }));

    // Assert
    expect(screen.getByText("Enter a name before generating the signature.")).toBeVisible();
  });
});
