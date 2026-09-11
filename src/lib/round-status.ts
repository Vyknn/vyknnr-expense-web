export const ROUND_STATUSES = ["in_progress", "completed", "cancelled"] as const;

export type RoundStatus = (typeof ROUND_STATUSES)[number];

export function isRoundStatus(value: string): value is RoundStatus {
  return (ROUND_STATUSES as readonly string[]).includes(value);
}

export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  in_progress: "ดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export const ROUND_STATUS_BADGE_CLASSES: Record<RoundStatus, string> = {
  in_progress: "bg-info-tint text-info",
  completed: "bg-success-tint text-success",
  cancelled: "bg-destructive-tint text-destructive",
};
