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
    const tail = document.querySelector(".forward-tail");
    const pages = spread ? Array.from(spread.children) : [];
    return {
      totalPages: pages.length,
      forwardText: forwardCheck?.textContent ?? null,
      tailPage: tail
        ? pages.findIndex((pageContainer) => pageContainer.contains(tail)) + 1
        : 0,
    };
  });

  if (result.totalPages !== 4) {
    throw new Error(`Expected 4 pages, got ${result.totalPages}`);
  }
  if (result.tailPage !== 3) {
    throw new Error(
      `Expected the forward-reference tail on page 3, got ${result.tailPage}`,
    );
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
