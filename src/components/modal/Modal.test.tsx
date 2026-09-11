import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "./Modal";

beforeAll(() => {
  // jsdom does not implement the native <dialog> behavior — stub it so the
  // component's open/close sync logic can run in tests.
  HTMLDialogElement.prototype.showModal = jest.fn(function (
    this: HTMLDialogElement
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = jest.fn(function (
    this: HTMLDialogElement
  ) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });
});

describe("Modal", () => {
  it("calls showModal when open becomes true", () => {
    render(
      <Modal open={true} onClose={jest.fn()} title="ทดสอบ">
        <p>เนื้อหา</p>
      </Modal>
    );

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(screen.getByText("เนื้อหา")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose} title="ทดสอบ">
        <p>เนื้อหา</p>
      </Modal>
    );

    fireEvent.click(screen.getByRole("button", { name: "ปิดหน้าต่าง" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the native dialog close event fires (Escape key)", () => {
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose} title="ทดสอบ">
        <p>เนื้อหา</p>
      </Modal>
    );

    fireEvent(screen.getByRole("dialog"), new Event("close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when clicking the backdrop (the dialog element itself)", () => {
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose} title="ทดสอบ">
        <p>เนื้อหา</p>
      </Modal>
    );

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });
});
