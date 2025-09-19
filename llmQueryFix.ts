import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { main as runGemini } from "./gemini";
import { extractJsonString } from "./utils/parser";

async function run() {
  const raw = await runGemini();
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error("Model returned empty or non-text output");
  }
  const json = extractJsonString(raw);
  const outPath = resolve(process.cwd(), "data.json");
  writeFileSync(outPath, json + "\n", { encoding: "utf-8" });
  console.log(`Wrote JSON to ${outPath}`);
}

run().catch((err) => {
  console.error("Failed to fetch or parse model output:", err);
  process.exit(1);
});
