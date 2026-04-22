import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignaturePadCard } from "@signature/react-internal/components/SignaturePadCard";

describe("SignaturePadCard", () => {
  it("connects drawing input to the animated preview card", async () => {
    // Arrange
    render(<SignaturePadCard width={240} height={120} />);

    const surface = screen.getByLabelText("Signature pad");
    vi.spyOn(surface, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 240,
      bottom: 120,
      width: 240,
      height: 120,
      toJSON: () => ({}),
    });

    // Act
    fireEvent.pointerDown(surface, { clientX: 20, clientY: 30, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 120, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 200, clientY: 80, pointerId: 1 });

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("signature-stroke")).toHaveLength(1);
    });
  });
});
