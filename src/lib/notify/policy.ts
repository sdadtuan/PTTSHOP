export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "***";
  return `${name.slice(0, 1)}***@${domain}`;
}

export type ReminderInput = {
  enabled: boolean;
  afterHours: number | null;
  maxTimes: number | null;
  ageHours: number;
  sentCount: number;
  marketingOptIn: boolean;
  ordered: boolean;
  inStock: boolean;
};

export function reminderLimits(hours: unknown, times: unknown) {
  const afterHours = typeof hours === "number" && Number.isInteger(hours) && hours > 0 ? hours : null;
  const maxTimes = typeof times === "number" && Number.isInteger(times) && times > 0 ? times : null;
  return { reminderAfterHours: afterHours, reminderMaxTimes: maxTimes };
}

export function reminderDecision(input: ReminderInput) {
  if (!input.enabled || input.afterHours == null || input.maxTimes == null) return "skip_disabled" as const;
  if (!input.marketingOptIn) return "skip_no_consent" as const;
  if (input.ordered) return "skip_ordered" as const;
  if (!input.inStock) return "skip_stock" as const;
  if (input.sentCount >= input.maxTimes) return "skip_cap" as const;
  if (input.ageHours < input.afterHours) return "skip_waiting" as const;
  return "dry_run" as const;
}
