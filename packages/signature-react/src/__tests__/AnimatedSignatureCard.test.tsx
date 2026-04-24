import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AnimatedSignatureCard,
  getFillPlaybackSegments,
  getStrokePlaybackSegments,
} from "@signature/react-internal/components/AnimatedSignatureCard";

describe("AnimatedSignatureCard", () => {
  it("shows an empty state when no signature is available", () => {
    // Arrange
    render(<AnimatedSignatureCard signature={null} />);

    // Assert
    expect(screen.getByText("Your signature preview will appear here.")).toBeVisible();
  });

  it("delays each stroke so glyphs are drawn sequentially and the final one flows in", () => {
    // Arrange
    render(
      <AnimatedSignatureCard
        signature={{
          width: 320,
          height: 120,
          viewBox: "0 0 320 120",
          paths: [
            { d: "M 0 0 L 100 0", length: 0 },
            { d: "M 100 0 L 200 0", length: 0 },
          ],
        }}
      />,
    );

    // Act
    const [firstPath, secondPath] = screen.getAllByTestId("signature-stroke");

    // Assert
    expect(firstPath).toHaveStyle({
      strokeDasharray: "100",
      animationDelay: "0ms",
    });
    expect(secondPath).toHaveStyle({ strokeDasharray: "100" });
    const secondDelayRaw = secondPath?.style.animationDelay ?? "0ms";
    const secondDelayMs = Number(secondDelayRaw.replace("ms", ""));
    expect(secondDelayMs).toBeGreaterThan(600);
    expect(secondDelayMs).toBeLessThan(900);
  });

  it("does not rely on CSS keyframes for stroke playback", () => {
    // Arrange
    render(
      <AnimatedSignatureCard
        signature={{
          width: 320,
          height: 120,
          viewBox: "0 0 320 120",
          paths: [{ d: "M 0 0 L 100 0", length: 0 }],
        }}
      />,
    );

    // Act
    const [path] = screen.getAllByTestId("signature-stroke");

    // Assert
    if (!path) {
      throw new Error("Expected a rendered signature stroke");
    }
    expect(path.style.animationName).toBe("");
  });

  it("renders one fill reveal segment per path in fill mode", () => {
    // Arrange
    render(
      <AnimatedSignatureCard
        renderMode="fill"
        signature={{
          width: 320,
          height: 120,
          viewBox: "0 0 320 120",
          paths: [
            {
              d: "M 10 10 L 90 10 L 90 70 L 10 70 Z",
              length: 0,
              bounds: { x: 10, y: 10, width: 80, height: 60 },
            },
            {
              d: "M 120 15 L 180 15 L 180 72 L 120 72 Z",
              length: 0,
              bounds: { x: 120, y: 15, width: 60, height: 57 },
            },
          ],
        }}
      />,
    );

    // Assert
    expect(screen.getAllByTestId("signature-fill-segment")).toHaveLength(2);
  });

  it("renders export controls alongside replay actions", () => {
    // Arrange
    render(
      <AnimatedSignatureCard
        signature={{
          width: 320,
          height: 120,
          viewBox: "0 0 320 120",
          paths: [{ d: "M 0 0 L 100 0", length: 0 }],
        }}
      />,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Replay animation" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeVisible();
  });

  it("uses linear timing through middle glyphs and eases out on the last fill segment", () => {
    // Arrange
    const segments = [
      { x: 10, width: 80 },
      { x: 110, width: 70 },
      { x: 205, width: 90 },
    ];

    // Act
    const result = getFillPlaybackSegments(segments);

    // Assert
    expect(result[0]?.ease).toBe("none");
    expect(result[1]?.ease).toBe("none");
    expect(result[2]?.ease).toBe("power3.out");
  });

  it("keeps middle strokes linear and applies a strong ease-out on the final one", () => {
    // Arrange
    const segments = [
      { start: 0, end: 0.2 },
      { start: 0.2, end: 0.7 },
      { start: 0.7, end: 1 },
    ];

    // Act
    const result = getStrokePlaybackSegments(segments);

    // Assert
    expect(result[0]?.ease).toBe("none");
    expect(result[1]?.ease).toBe("none");
    expect(result[2]?.ease).toBe("power3.out");
  });

  it("restarts the animation timeline when replay is pressed", () => {
    // Arrange
    render(
      <AnimatedSignatureCard
        signature={{
          width: 320,
          height: 120,
          viewBox: "0 0 320 120",
          paths: [{ d: "M 0 0 L 100 0", length: 0 }],
        }}
      />,
    );

    const frame = screen.getByTestId("signature-frame");
    expect(frame).toHaveAttribute("data-replay-token", "0");

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Replay animation" }));

    // Assert
    expect(frame).toHaveAttribute("data-replay-token", "1");
  });

  it("restarts from the beginning when the restart token changes", () => {
    // Arrange
    const signature = {
      width: 320,
      height: 120,
      viewBox: "0 0 320 120",
      paths: [{ d: "M 0 0 L 100 0", length: 0 }],
    };
    const { rerender } = render(
      <AnimatedSignatureCard restartToken={0} signature={signature} />,
    );

    // Act
    rerender(<AnimatedSignatureCard restartToken={2} signature={signature} />);

    // Assert
    expect(screen.getByTestId("signature-frame")).toHaveAttribute(
      "data-replay-token",
      "2",
    );
  });
});
