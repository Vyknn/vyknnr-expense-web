const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});

/** Formats an integer satang amount (baht * 100) as a THB currency string. */
export function formatCurrencyTHB(satang: number): string {
  return thb.format(satang / 100);
}
