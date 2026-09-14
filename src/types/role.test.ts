import {
  canManageExpenses,
  canManageSettings,
  isRole,
} from "./role";

describe("role permissions", () => {
  it.each(["admin", "editor", "viewer"])("recognizes the %s role", (role) => {
    expect(isRole(role)).toBe(true);
  });

  it("rejects unsupported roles", () => {
    expect(isRole("owner")).toBe(false);
  });

  it("grants expense mutations only to Admin and Editor", () => {
    expect(canManageExpenses("admin")).toBe(true);
    expect(canManageExpenses("editor")).toBe(true);
    expect(canManageExpenses("viewer")).toBe(false);
  });

  it("grants settings mutations only to Admin", () => {
    expect(canManageSettings("admin")).toBe(true);
    expect(canManageSettings("editor")).toBe(false);
    expect(canManageSettings("viewer")).toBe(false);
  });
});
