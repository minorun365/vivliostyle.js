import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(
    "http://localhost:3300/viewer/lib/vivliostyle-viewer-dev.html#src=http://localhost:3300/core/test/files/target-text-shrinking-spine/publication.json&zoom=1&spread=false",
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
    const forwardCheck = document.querySelector(".forward-check");
    const tail = document.querySelector(".tail");
    const summary = document.querySelector(".summary");
    const chapterTwo = document.querySelector("#chapter-two");
    const target = document.querySelector("#chapter-4");
    const pages = spread ? Array.from(spread.children) : [];
    const pageOf = (element) =>
      element
        ? pages.findIndex((pageContainer) => pageContainer.contains(element)) +
          1
        : 0;
    return {
      totalPages: pages.length,
      forwardText: forwardCheck?.textContent ?? null,
      forwardPage: pageOf(forwardCheck),
      tailPage: pageOf(tail),
      summaryPage: pageOf(summary),
      chapterTwoPage: pageOf(chapterTwo),
      targetPage: pageOf(target),
    };
  });

  if (result.totalPages !== 4) {
    throw new Error(`Expected 4 pages, got ${result.totalPages}`);
  }
  if (result.forwardPage !== 1 || result.tailPage !== 1) {
    throw new Error(
      `Expected the retained source to reflow on page 1, got ${JSON.stringify(result)}`,
    );
  }
  if (
    result.summaryPage !== 2 ||
    result.chapterTwoPage !== 3 ||
    result.targetPage !== 4
  ) {
    throw new Error(`Unexpected pagination: ${JSON.stringify(result)}`);
  }
  if (
    !result.forwardText ||
    result.forwardText.includes("WIDE") ||
    result.forwardText.includes("??") ||
    result.forwardText !== "d".repeat(20)
  ) {
    throw new Error(
      `Expected rebuilt page-4 references, got ${JSON.stringify(result.forwardText)}`,
    );
  }

  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
