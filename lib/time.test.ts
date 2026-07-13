import { describe, expect, it } from "vitest";
import { durationToSeconds, formatDuration } from "./time";

describe("time utilities", () => {
  it("converts track durations to seconds", () => {
    expect(durationToSeconds("3:45")).toBe(225);
  });

  it("formats player positions with tabular-friendly zero padding", () => {
    expect(formatDuration(84)).toBe("01:24");
  });
});
