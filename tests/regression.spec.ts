import { test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
for (const suite of ["library", "media"]) {
  test(`${suite}: production-build regression`, async ({}, testInfo) => {
    const { stdout } = await exec(process.execPath, [`tests/${suite}.cjs`], {
      env: {
        ...process.env,
        FABLE_URL: "http://127.0.0.1:4173",
        FABLE_SCREENSHOTS: testInfo.outputPath("screenshots"),
      },
      timeout: 80_000,
    });
    await testInfo.attach("regression-results", {
      body: stdout,
      contentType: "text/plain",
    });
    console.log(stdout.trim());
  });
}
