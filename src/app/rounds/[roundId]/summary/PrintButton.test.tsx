import { fireEvent, render, screen } from "@testing-library/react";
import { PrintButton } from "./PrintButton";

describe("PrintButton", () => {
  it("opens the browser print dialog", () => {
    const print = jest.fn();
    Object.defineProperty(window, "print", { configurable: true, value: print });

    render(<PrintButton />);
    fireEvent.click(screen.getByRole("button", { name: "พิมพ์รายการเบิก" }));

    expect(print).toHaveBeenCalledTimes(1);
  });
});
