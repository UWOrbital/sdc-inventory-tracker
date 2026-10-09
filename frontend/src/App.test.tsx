import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import App from "./App";

it("increments the counter when clicked", async () => {
  const user = userEvent.setup();
  render(<App />);

  const button = screen.getByRole("button", { name: "Count is 0" });
  await user.click(button);

  expect(button.textContent).toBe("Count is 1");
});
