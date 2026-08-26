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
if (targetPageCount !== 3) {
  throw new Error(
    `Expected the corrected target-counter case to finish in 3 pages, got ${targetPageCount}`,
  );
}
const baselineTargetPageCount = pageBreakTarget.difference?.baseline?.totalPages;
if (baselineTargetPageCount !== 4) {
  throw new Error(
    `Expected the stable target-counter case to reproduce in 4 pages, got ${baselineTargetPageCount}`,
  );
}

const combinedBreaks = entryFor("page_breaks/combine_breaks_2.html");
assertNoRenderError(combinedBreaks);
if (combinedBreaks.viewerChanged) {
  throw new Error("combine_breaks_2.html changed from the stable baseline");
}

const shrinkingSpine = entryFor("target-text-shrinking-spine/publication.json");
assertNoRenderError(shrinkingSpine);
const shrinkingPageCount = shrinkingSpine.difference?.actual?.totalPages;
if (shrinkingPageCount !== 4) {
  throw new Error(
    `Expected the shrinking-spine case to finish in 4 pages, got ${shrinkingPageCount}`,
  );
}
const baselineShrinkingPageCount =
  shrinkingSpine.difference?.baseline?.totalPages;
if (baselineShrinkingPageCount !== 6) {
  throw new Error(
    `Expected the stable shrinking-spine case to reproduce in 6 pages, got ${baselineShrinkingPageCount}`,
  );
}

const retainedSource = entryFor(
  "target-counter-retained-source/publication.json",
);
assertNoRenderError(retainedSource);
const retainedSourcePageCount = retainedSource.difference?.actual?.totalPages;
if (retainedSourcePageCount !== 8) {
  throw new Error(
    `Expected the retained-source case to stabilize at 8 pages, got ${retainedSourcePageCount}`,
  );
}

console.log(
  "Validated: corrected page breaks, completed pagination, unchanged combined breaks, shrinking-spine rendering, and retained-source repagination.",
);
