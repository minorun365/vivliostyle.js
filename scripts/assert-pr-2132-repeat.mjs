import fs from "node:fs";

for (let attempt = 1; attempt <= 5; attempt++) {
  const report = JSON.parse(
    fs.readFileSync(
      `artifacts/layout-regression-repeat-${attempt}/report.json`,
      "utf8",
    ),
  );
  const shrinkingSpine = report.entries.find((entry) =>
    (Array.isArray(entry.file) ? entry.file : [entry.file]).includes(
      "target-text-shrinking-spine/publication.json",
    ),
  );
  const retainedSource = report.entries.find((entry) =>
    (Array.isArray(entry.file) ? entry.file : [entry.file]).includes(
      "target-counter-retained-source/publication.json",
    ),
  );
  if (!shrinkingSpine || !retainedSource) {
    throw new Error(`Attempt ${attempt} did not report both reference cases`);
  }
  if (
    report.summary.timeoutEntries ||
    shrinkingSpine.errors?.length ||
    retainedSource.errors?.length
  ) {
    throw new Error(
      `Attempt ${attempt} did not finish: ${JSON.stringify([
        shrinkingSpine.errors,
        retainedSource.errors,
      ])}`,
    );
  }
  if (shrinkingSpine.difference?.actual?.totalPages !== 4) {
    throw new Error(
      `Attempt ${attempt} produced ${shrinkingSpine.difference?.actual?.totalPages} shrinking-spine pages instead of 4`,
    );
  }
  if (retainedSource.difference?.actual?.totalPages !== 8) {
    throw new Error(
      `Attempt ${attempt} produced ${retainedSource.difference?.actual?.totalPages} retained-source pages instead of 8`,
    );
  }
}

console.log("both cross-reference cases completed 5 consecutive times");
