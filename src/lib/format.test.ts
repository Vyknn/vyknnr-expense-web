import { formatCurrencyTHB } from "./format";

describe("formatCurrencyTHB", () => {
  it("formats whole baht amounts with two decimal places and thousands separators", () => {
    expect(formatCurrencyTHB(150000)).toContain("1,500.00");
  });

  it("formats satang remainders correctly", () => {
    expect(formatCurrencyTHB(150075)).toContain("1,500.75");
  });

  it("includes the THB currency symbol", () => {
    expect(formatCurrencyTHB(100)).toContain("฿");
  });

  it("formats zero", () => {
    expect(formatCurrencyTHB(0)).toContain("0.00");
  });
});
