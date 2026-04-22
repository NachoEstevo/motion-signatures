import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignatureNameField } from "@signature/react-internal/components/SignatureNameField";

describe("SignatureNameField", () => {
  it("converts typed text into a signature vector", async () => {
    // Arrange
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <SignatureNameField
        loadFont={async () => ({
          getPath: () => ({
            toPathData: () => "M 0 0 C 10 0 20 20 30 20",
            getBoundingBox: () => ({
              x1: 0,
              y1: 0,
              x2: 30,
              y2: 20,
            }),
          }),
        })}
        onChange={handleChange}
      />,
    );

    // Act
    await user.type(screen.getByLabelText("Type your name"), "Nacho");
    await user.click(screen.getByRole("button", { name: "Generate signature" }));

    // Assert
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          viewBox: "0 0 320 120",
        }),
      );
    });
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
