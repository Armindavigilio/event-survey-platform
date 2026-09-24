// scripts/test-survey.mjs
// Compiles isolated survey tests into a temporary folder and runs Node's test runner.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const output = mkdtempSync(join(tmpdir(), "event-survey-tests-"));
try {
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc",
    "--target", "ES2022", "--module", "commonjs", "--moduleResolution", "node",
    "--strict", "--esModuleInterop", "--skipLibCheck", "--outDir", output,
    "tests/survey.test.ts"], { stdio: "inherit" });
  execFileSync(process.execPath, ["--test", join(output, "tests/survey.test.js")], { stdio: "inherit" });
} finally {
  rmSync(output, { recursive: true, force: true });
}
