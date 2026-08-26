import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(
    "http://localhost:3300/viewer/lib/vivliostyle-viewer-dev.html#src=http://localhost:3300/core/test/files/target-counter-retained-source/publication.json&zoom=1&spread=false",
    { waitUntil: "domcontentloaded", timeout: 180_000 },
  );
  await page.waitForFunction(
    () =>
      document.body?.getAttribute("data-vivliostyle-viewer-status") ===
      "complete",
    undefined,
    { timeout: 180_000 },
  );

  const result = await page.evaluate(() => {
    const spread = document.querySelector(
      "#vivliostyle-viewer-viewport [data-vivliostyle-spread-container]",
    );
    const pages = spread ? Array.from(spread.children) : [];
    const sourceReference = document.querySelector(".page-number");
    const target = document.querySelector("#target");
    const pageOf = (node) =>
      node
        ? pages.findIndex((pageContainer) => pageContainer.contains(node)) + 1
        : 0;
    return {
      totalPages: pages.length,
      sourcePage: pageOf(sourceReference),
      sourceText: sourceReference?.textContent ?? null,
      targetPage: pageOf(target),
    };
  });

  if (result.totalPages !== 8) {
    throw new Error(`Expected 8 pages, got ${result.totalPages}`);
  }
  if (result.sourcePage !== 1) {
    throw new Error(
      `Expected the retained source to repaginate onto page 1, got ${result.sourcePage}`,
    );
  }
  if (result.sourceText !== " (page 8)") {
    throw new Error(
      `Expected the retained reference to resolve to page 8, got ${JSON.stringify(result.sourceText)}`,
    );
  }
  if (result.targetPage !== 8) {
    throw new Error(
      `Expected the target on page 8 after transitive shrinkage, got ${result.targetPage}`,
    );
  }

  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
