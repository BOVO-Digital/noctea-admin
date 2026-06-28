export const VALID_CONTENT_TYPES = ["articles", "stories", "conseils", "wellbeing"] as const;
export const VALID_CONTENT_STATUSES = [
  "draft",
  "pending_review",
  "scheduled",
  "published",
  "archived",
] as const;
export const VALID_CONTENT_PLANS = ["free", "lune", "etoile", "soleil"] as const;

export type ContentType = (typeof VALID_CONTENT_TYPES)[number];
export type ContentStatus = (typeof VALID_CONTENT_STATUSES)[number];
export type ContentPlan = (typeof VALID_CONTENT_PLANS)[number];

export function isValidContentType(v: unknown): v is ContentType {
  return VALID_CONTENT_TYPES.includes(v as ContentType);
}

export function isValidContentStatus(v: unknown): v is ContentStatus {
  return VALID_CONTENT_STATUSES.includes(v as ContentStatus);
}

export function isValidContentPlan(v: unknown): v is ContentPlan {
  return VALID_CONTENT_PLANS.includes(v as ContentPlan);
}

export function resolvePublishStatus(
  scheduledAt: Date | null,
  now = new Date()
): "published" | "scheduled" {
  if (scheduledAt && scheduledAt.getTime() > now.getTime()) {
    return "scheduled";
  }
  return "published";
}
