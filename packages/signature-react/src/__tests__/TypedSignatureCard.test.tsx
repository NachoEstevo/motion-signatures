import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TypedSignatureCard } from "@signature/react-internal/components/TypedSignatureCard";

describe("TypedSignatureCard", () => {
  it("connects typed input to the animated preview card", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <TypedSignatureCard
        loadFont={async () => ({
          getPath: () => ({
            toPathData: () => "M 0 0 C 20 0 40 30 70 30",
            getBoundingBox: () => ({
              x1: 0,
              y1: 0,
              x2: 70,
              y2: 30,
            }),
          }),
        })}
      />,
    );

    // Act
    await user.type(screen.getByLabelText("Type your name"), "Nacho");
    await user.click(screen.getByRole("button", { name: "Generate signature" }));

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("signature-stroke")).toHaveLength(1);
    });
  });
});
