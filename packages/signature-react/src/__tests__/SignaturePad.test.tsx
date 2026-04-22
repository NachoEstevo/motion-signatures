import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignaturePad } from "@signature/react-internal/components/SignaturePad";

describe("SignaturePad", () => {
  it("captures pointer input and emits a signature vector on pointer up", () => {
    // Arrange
    const handleChange = vi.fn();
    render(<SignaturePad width={240} height={120} onChange={handleChange} />);

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
    fireEvent.pointerDown(surface, {
      clientX: 20,
      clientY: 30,
      pointerId: 1,
    });
    fireEvent.pointerMove(surface, {
      clientX: 120,
      clientY: 60,
      pointerId: 1,
    });
    fireEvent.pointerUp(surface, {
      clientX: 200,
      clientY: 80,
      pointerId: 1,
    });

    // Assert
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 240,
        height: 120,
        paths: [
          expect.objectContaining({
            d: expect.stringContaining("M"),
          }),
        ],
      }),
    );
  });

  it("clears the signature and notifies listeners", () => {
    // Arrange
    const handleChange = vi.fn();
    render(<SignaturePad width={240} height={120} onChange={handleChange} />);

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

    fireEvent.pointerDown(surface, { clientX: 20, clientY: 30, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 120, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 200, clientY: 80, pointerId: 1 });

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Clear signature" }));

    // Assert
    expect(handleChange).toHaveBeenLastCalledWith(null);
  });
});
