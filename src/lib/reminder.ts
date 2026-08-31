const UNIT_TO_MS: Record<string, number> = {
  minutes: 60_000,
  heures: 3_600_000,
  jours: 86_400_000,
  semaines: 604_800_000,
};

const PRESET_TO_MS: Record<string, number> = {
  "0 min": 0,
  "5 min avant": 5 * 60_000,
  "10 min avant": 10 * 60_000,
  "15 min avant": 15 * 60_000,
  "30 min avant": 30 * 60_000,
  "1 h avant": 3_600_000,
  "2 h avant": 2 * 3_600_000,
  "1 jour avant": 86_400_000,
  "2 jours avant": 2 * 86_400_000,
  "1 semaine avant": 604_800_000,
};

/**
 * Converts the reminder preset UI (kept as-is from the original mock) into
 * an actual ISO timestamp the backend's reminderAt field expects.
 */
export function computeReminderAt(
  scheduledAt: Date,
  preset: string,
  customVal: string,
  customUnit: string,
): string | null {
  if (preset === "Aucun") return null;

  if (preset === "custom") {
    const amount = Number(customVal) || 0;
    const ms = amount * (UNIT_TO_MS[customUnit] ?? UNIT_TO_MS.minutes);
    return new Date(scheduledAt.getTime() - ms).toISOString();
  }

  const ms = PRESET_TO_MS[preset];
  if (ms === undefined) return null;
  return new Date(scheduledAt.getTime() - ms).toISOString();
}
