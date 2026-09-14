export const expenseCategories = [
  { value: "food", label: "อาหาร" },
  { value: "travel", label: "การเดินทาง" },
  { value: "accommodation", label: "ที่พัก" },
  { value: "supplies", label: "อุปกรณ์" },
  { value: "advance", label: "สำรองจ่าย" },
  { value: "other", label: "อื่นๆ" },
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number]["value"];

const expenseCategoryValues = new Set<ExpenseCategory>(
  expenseCategories.map((category) => category.value)
);

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return expenseCategoryValues.has(value as ExpenseCategory);
}

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  return expenseCategories.find((option) => option.value === category)!.label;
}
