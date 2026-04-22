import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Demo App", () => {
  it("renders the curated signature gallery landing screen", () => {
    // Arrange
    render(<App />);

    // Assert
    expect(
      screen.getByRole("heading", { name: "Signature motion for documents that deserve craft." }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Enter the studio" })).toBeVisible();
  });

  it("lets the inline hero control switch the featured signature mode", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<App />);

    // Act
    await user.click(screen.getByRole("button", { name: "Switch featured mode to typed" }));

    // Assert
    expect(screen.getByRole("button", { name: "Switch featured mode to drawn" })).toBeVisible();
    expect(screen.getAllByText("Typed signature trace")).toHaveLength(2);
  });

  it("expands the signature card into a full interaction studio", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<App />);

    // Act
    await user.click(screen.getByRole("button", { name: "Enter the studio" }));

    // Assert
    expect(screen.getByRole("heading", { name: "Signature trace studio" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Draw by hand" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Type to generate" })).toBeVisible();
    expect(screen.getByLabelText("Signature pad")).toBeVisible();
    expect(screen.queryByText("What changed")).not.toBeInTheDocument();
  });

  it("opens the studio in typed mode when the hero toggle selects typed first", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<App />);

    // Act
    await user.click(
      screen.getByRole("button", { name: "Switch featured mode to typed" }),
    );
    await user.click(screen.getByRole("button", { name: "Enter the studio" }));

    // Assert
    expect(screen.getByLabelText("Type your name")).toBeVisible();
    expect(screen.queryByLabelText("Signature pad")).not.toBeInTheDocument();
  });

  it("exposes download controls on the contract card", () => {
    // Arrange
    render(<App />);

    // Assert
    expect(screen.getByRole("button", { name: /download svg/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /download png/i })).toBeVisible();
  });

  it("opens a use-case dialog with extended content when Learn more is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<App />);

    // Act
    const [firstLearnMore] = screen.getAllByRole("button", { name: /learn more about/i });

    if (!firstLearnMore) {
      throw new Error("Expected at least one Learn more button");
    }

    await user.click(firstLearnMore);

    // Assert
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAccessibleName();
  });

  it("closes the use-case dialog with the close control", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<App />);

    // Act
    const [firstLearnMore] = screen.getAllByRole("button", { name: /learn more about/i });

    if (!firstLearnMore) {
      throw new Error("Expected at least one Learn more button");
    }

    await user.click(firstLearnMore);
    await user.click(screen.getByRole("button", { name: /close dialog/i }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
