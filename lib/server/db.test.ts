import { describe, expect, it } from "vitest";
import { readDatabase } from "./db";

describe("local project database", () => {
  it("returns the expected database shape", async () => {
    const database = await readDatabase();

    expect(Array.isArray(database.projects)).toBe(true);
    expect(Array.isArray(database.prompts)).toBe(true);
    expect(Array.isArray(database.jobs)).toBe(true);
    expect(Array.isArray(database.uploads)).toBe(true);
  });
});
