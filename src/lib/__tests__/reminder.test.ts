import { describe, expect, it } from "vitest";
import { computeReminderAt } from "@/lib/reminder";

describe("computeReminderAt", () => {
  const scheduled = new Date(2026, 0, 15, 10, 0, 0); // 15 Jan 2026 at 10:00 local

  it("returns null when the preset is Aucun", () => {
    expect(computeReminderAt(scheduled, "Aucun", "", "")).toBeNull();
  });

  it("returns the scheduled time when the preset is 0 min", () => {
    expect(computeReminderAt(scheduled, "0 min", "", "")).toBe(scheduled.toISOString());
  });

  it("subtracts a fixed presets duration", () => {
    const expected = new Date(scheduled.getTime() - 60_000).toISOString();
    expect(computeReminderAt(scheduled, "1 min ... unknown", "", "")).toBeNull();
    expect(computeReminderAt(scheduled, "15 min avant", "", "")).toBe(
      new Date(scheduled.getTime() - 15 * 60_000).toISOString(),
    );
  });

  it("subtracts a one-hour preset", () => {
    expect(computeReminderAt(scheduled, "1 h avant", "", "")).toBe(
      new Date(scheduled.getTime() - 3_600_000).toISOString(),
    );
  });

  it("handles a custom preset with a numeric amount and unit", () => {
    expect(computeReminderAt(scheduled, "custom", "30", "minutes")).toBe(
      new Date(scheduled.getTime() - 30 * 60_000).toISOString(),
    );
    expect(computeReminderAt(scheduled, "custom", "2", "jours")).toBe(
      new Date(scheduled.getTime() - 2 * 86_400_000).toISOString(),
    );
    expect(computeReminderAt(scheduled, "custom", "3", "semaines")).toBe(
      new Date(scheduled.getTime() - 3 * 604_800_000).toISOString(),
    );
  });

  it("treats an invalid custom amount as zero", () => {
    expect(computeReminderAt(scheduled, "custom", "abc", "minutes")).toBe(scheduled.toISOString());
  });

  it("treats an empty custom unit as minutes", () => {
    expect(computeReminderAt(scheduled, "custom", "5", "")).toBe(
      new Date(scheduled.getTime() - 5 * 60_000).toISOString(),
    );
  });
});
