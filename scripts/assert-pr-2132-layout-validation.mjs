import fs from "node:fs";

const report = JSON.parse(
  fs.readFileSync("artifacts/layout-regression/report.json", "utf8"),
);

function entryFor(file) {
  const entry = report.entries.find((candidate) =>
    (Array.isArray(candidate.file)
      ? candidate.file
      : [candidate.file]
    ).includes(file),
  );
  if (!entry) {
    throw new Error(`Missing layout result for ${file}`);
  }
  return entry;
}

function assertNoRenderError(entry) {
  if (entry.errors?.length) {
    throw new Error(
      `${entry.title} did not finish rendering: ${JSON.stringify(entry.errors)}`,
    );
  }
}

if (report.summary.timeoutEntries !== 0) {
  throw new Error(
    `Pagination timed out for ${report.summary.timeoutEntries} case(s)`,
  );
}

const pageBreakTarget = entryFor(
  "page_breaks/break-before-flex-at-page-start.html",
);
assertNoRenderError(pageBreakTarget);
const targetPageCount = pageBreakTarget.difference?.actual?.totalPages;
if (targetPageCount !== 2) {
  throw new Error(
    `Expected the corrected target-counter case to finish in 2 pages, got ${targetPageCount}`,
  );
}

const combinedBreaks = entryFor("page_breaks/combine_breaks_2.html");
assertNoRenderError(combinedBreaks);
if (combinedBreaks.viewerChanged) {
  throw new Error("combine_breaks_2.html changed from the stable baseline");
}

const shrinkingSpine = entryFor("target-text-shrinking-spine/publication.json");
assertNoRenderError(shrinkingSpine);

console.log(
  "Validated: corrected two-page result, completed pagination, unchanged combined breaks, and shrinking-spine rendering.",
);
