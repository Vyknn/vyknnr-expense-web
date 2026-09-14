import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemberStatusToggle } from "./MemberStatusToggle";
import { updateMemberStatus } from "./actions";

jest.mock("./actions", () => ({
  updateMemberStatus: jest.fn(),
}));

const mockUpdateMemberStatus = updateMemberStatus as jest.Mock;

describe("MemberStatusToggle", () => {
  beforeEach(() => {
    mockUpdateMemberStatus.mockReset();
  });

  it("optimistically flips state on click and submits the expected form data", async () => {
    mockUpdateMemberStatus.mockResolvedValue({ status: "success" });
    render(
      <MemberStatusToggle memberId={1} memberName="ทดสอบ" isActive={true} />
    );

    const toggle = screen.getByRole("switch", {
      name: "ปิดใช้งานบัญชี ทดสอบ",
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await waitFor(() =>
      expect(mockUpdateMemberStatus).toHaveBeenCalledTimes(1)
    );
    const formData = mockUpdateMemberStatus.mock.calls[0][1] as FormData;
    expect(formData.get("memberId")).toBe("1");
    expect(formData.get("isActive")).toBe("0");
  });

  it("reverts the optimistic state and alerts when the update fails", async () => {
    mockUpdateMemberStatus.mockResolvedValue({
      status: "error",
      message: "ไม่สามารถปิดใช้งานบัญชีของตนเองได้",
    });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <MemberStatusToggle memberId={1} memberName="ทดสอบ" isActive={true} />
    );
    const toggle = screen.getByRole("switch", {
      name: "ปิดใช้งานบัญชี ทดสอบ",
    });
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-checked", "true")
    );
    expect(alertSpy).toHaveBeenCalledWith(
      "ไม่สามารถปิดใช้งานบัญชีของตนเองได้"
    );

    alertSpy.mockRestore();
  });

  it("is disabled when the disabled prop is set (e.g. the signed-in admin's own row)", () => {
    render(
      <MemberStatusToggle
        memberId={1}
        memberName="ทดสอบ"
        isActive={true}
        disabled
      />
    );
    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
