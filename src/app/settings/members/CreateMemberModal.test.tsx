import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CreateMemberModal } from "./CreateMemberModal";
import { createMember } from "./actions";

jest.mock("./actions", () => ({
  createMember: jest.fn(),
}));

const mockCreateMember = createMember as jest.Mock;

beforeAll(() => {
  // jsdom does not implement the native <dialog> behavior — stub it so the
  // Modal's open/close sync logic can run in tests.
  HTMLDialogElement.prototype.showModal = jest.fn(function (
    this: HTMLDialogElement
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = jest.fn(function (
    this: HTMLDialogElement
  ) {
    this.removeAttribute("open");
  });
});

describe("CreateMemberModal", () => {
  beforeEach(() => {
    mockCreateMember.mockReset();
  });

  it("submits displayName, email, role and tempPassword", async () => {
    mockCreateMember.mockResolvedValue({ status: "success" });
    render(<CreateMemberModal />);

    fireEvent.click(screen.getByRole("button", { name: "เพิ่มสมาชิก" }));

    fireEvent.change(screen.getByLabelText("ชื่อสมาชิก"), {
      target: { value: "สมชาย ใจดี" },
    });
    fireEvent.change(screen.getByLabelText("อีเมล"), {
      target: { value: "somchai@example.com" },
    });
    fireEvent.change(screen.getByLabelText("สิทธิ์การใช้งาน"), {
      target: { value: "editor" },
    });
    fireEvent.change(screen.getByLabelText(/รหัสผ่านชั่วคราว/), {
      target: { value: "temporary-pass-123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "บันทึกสมาชิก" }));

    await waitFor(() => expect(mockCreateMember).toHaveBeenCalledTimes(1));
    const formData = mockCreateMember.mock.calls[0][1] as FormData;
    expect(formData.get("displayName")).toBe("สมชาย ใจดี");
    expect(formData.get("email")).toBe("somchai@example.com");
    expect(formData.get("role")).toBe("editor");
    expect(formData.get("tempPassword")).toBe("temporary-pass-123");
    expect(await screen.findByText(/สร้างสมาชิกสำเร็จ/)).toBeInTheDocument();
    expect(screen.getByText("temporary-pass-123")).toBeInTheDocument();
  });

  it("shows the error message returned by the action", async () => {
    mockCreateMember.mockResolvedValue({
      status: "error",
      message: "มีอีเมลนี้ในระบบแล้ว",
    });
    render(<CreateMemberModal />);

    fireEvent.click(screen.getByRole("button", { name: "เพิ่มสมาชิก" }));
    fireEvent.change(screen.getByLabelText("ชื่อสมาชิก"), {
      target: { value: "ก" },
    });
    fireEvent.change(screen.getByLabelText("อีเมล"), {
      target: { value: "a@a.com" },
    });
    fireEvent.change(screen.getByLabelText(/รหัสผ่านชั่วคราว/), {
      target: { value: "temporary-pass-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกสมาชิก" }));

    expect(await screen.findByText("มีอีเมลนี้ในระบบแล้ว")).toBeInTheDocument();
  });
});
