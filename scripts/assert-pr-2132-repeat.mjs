import fs from "node:fs";

for (let attempt = 1; attempt <= 5; attempt++) {
  const report = JSON.parse(
    fs.readFileSync(
      `artifacts/layout-regression-${attempt}/report.json`,
      "utf8",
    ),
  );
  const entry = report.entries[0];
  if (report.summary.timeoutEntries || entry.errors?.length) {
    throw new Error(
      `Attempt ${attempt} did not finish: ${JSON.stringify(entry.errors)}`,
    );
  }
  if (entry.difference?.actual?.totalPages !== 4) {
    throw new Error(
      `Attempt ${attempt} produced ${entry.difference?.actual?.totalPages} pages instead of 4`,
    );
  }
}

console.log("target-text shrinking spine completed 5 consecutive times");
