import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EditMemberRoleModal } from "./EditMemberRoleModal";
import { updateMemberRole } from "./actions";
import type { MemberSummary } from "./queries";

jest.mock("./actions", () => ({
  updateMemberRole: jest.fn(),
}));

const mockUpdateMemberRole = updateMemberRole as jest.Mock;

beforeAll(() => {
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

const member: MemberSummary = {
  id: 42,
  email: "member@example.com",
  displayName: "สมาชิกทดสอบ",
  role: "viewer",
  isActive: true,
  mustChangePassword: false,
  createdAt: new Date().toISOString(),
};

describe("EditMemberRoleModal", () => {
  beforeEach(() => {
    mockUpdateMemberRole.mockReset();
  });

  it("submits the memberId and the newly selected role", async () => {
    mockUpdateMemberRole.mockResolvedValue({ status: "success" });
    render(<EditMemberRoleModal member={member} />);

    fireEvent.click(
      screen.getByRole("button", { name: `แก้ไขสิทธิ์ของ ${member.displayName}` })
    );
    fireEvent.change(screen.getByLabelText("สิทธิ์การใช้งาน"), {
      target: { value: "editor" },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกสิทธิ์" }));

    await waitFor(() => expect(mockUpdateMemberRole).toHaveBeenCalledTimes(1));
    const formData = mockUpdateMemberRole.mock.calls[0][1] as FormData;
    expect(formData.get("memberId")).toBe(String(member.id));
    expect(formData.get("role")).toBe("editor");
  });

  it("shows the error returned when trying to change one's own role", async () => {
    mockUpdateMemberRole.mockResolvedValue({
      status: "error",
      message: "ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้",
    });
    render(<EditMemberRoleModal member={member} />);

    fireEvent.click(
      screen.getByRole("button", { name: `แก้ไขสิทธิ์ของ ${member.displayName}` })
    );
    fireEvent.click(screen.getByRole("button", { name: "บันทึกสิทธิ์" }));

    expect(
      await screen.findByText("ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้")
    ).toBeInTheDocument();
  });
});
