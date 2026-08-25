/**
 * Copyright 2026 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as Counters from "../../../src/vivliostyle/counters";
import * as Layout from "../../../src/vivliostyle/layout";
import * as LayoutProcessor from "../../../src/vivliostyle/layout-processor";
import * as Vtree from "../../../src/vivliostyle/vtree";

const documentURLTransformer = {
  transformFragment(fragment) {
    return fragment;
  },
  transformURL(url) {
    return url;
  },
  restoreURL(url) {
    return [url];
  },
};

function createNodeContext(id) {
  const element = document.createElement("h2");
  element.id = id;
  const nodeContext = new Vtree.NodeContext(
    element,
    null,
    0,
    new LayoutProcessor.BlockFormattingContext(null),
  );
  nodeContext.viewNode = element;
  return nodeContext;
}

describe("cross-reference layout constraint", function () {
  it("allows a target to move earlier after a satisfied page break", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const reference = new Counters.TargetCounterReference("target", true);
    store.pageIndicesById.target = { spineIndex: 0, pageIndex: 2 };
    store.resolvedReferences.target = [reference];

    const constraint = store.createLayoutConstraint(1);
    const nodeContext = createNodeContext("target");

    expect(constraint.allowLayout(nodeContext)).toBe(false);
    expect(constraint.allowLayoutAfterPageBreak(nodeContext)).toBe(true);

    expect(constraint.allowLayoutAfterPageBreak(nodeContext)).toBe(true);
  });

  it("keeps non-counter constraints after a satisfied page break", function () {
    const nodeContext = createNodeContext("target");
    const counterConstraint = {
      allowLayout() {
        return false;
      },
      allowLayoutAfterPageBreak() {
        return true;
      },
    };
    const rejectingConstraint = {
      allowLayout() {
        return false;
      },
    };
    const constraint = new Layout.AllLayoutConstraint([
      counterConstraint,
      rejectingConstraint,
    ]);

    expect(constraint.allowLayoutAfterPageBreak(nodeContext)).toBe(false);
  });

  it("keeps references stable when a target moves to an earlier page", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const reference = new Counters.TargetCounterReference("target", true);
    store.pageIndicesById.target = { spineIndex: 0, pageIndex: 2 };
    store.resolvedReferences.target = [reference];

    const container = document.createElement("div");
    const page = new Vtree.Page(container, container);
    const target = document.createElement("h2");
    target.id = "target";
    page.elementsById.target = [target];
    store.currentPage = page;

    const constraint = store.createLayoutConstraint(1);
    const nodeContext = createNodeContext("target");
    expect(constraint.allowLayoutAfterPageBreak(nodeContext)).toBe(true);

    store.finishPage(0, 1);

    expect(reference.isResolved()).toBe(true);
    expect(store.resolvedReferences.target).toEqual([reference]);
    expect(store.unresolvedReferences.target).toBeUndefined();

    store.pageIndicesById.target = { spineIndex: 0, pageIndex: 1 };
    const earlierConstraint = store.createLayoutConstraint(0);
    expect(earlierConstraint.allowLayoutAfterPageBreak(nodeContext)).toBe(
      false,
    );
  });

  it("updates target counters after a target moves to an earlier page", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const reference = new Counters.TargetCounterReference("target", true);
    store.pageIndicesById.target = { spineIndex: 0, pageIndex: 2 };
    store.resolvedReferences.target = [reference];
    store.currentPageCounters.page = [2];

    const pageContainer = document.createElement("div");
    const page = new Vtree.Page(pageContainer, pageContainer);
    const target = document.createElement("h2");
    target.id = "target";
    page.elementsById.target = [target];
    store.currentPage = page;
    store.finishPage(0, 1);

    const expression = { key: "target-counter-key" };
    store.registerTargetCounterExpr(
      "page",
      (value) => String(value),
      expression,
      "target",
    );
    const root = document.createElement("div");
    const targetCounter = document.createElement("span");
    targetCounter.setAttribute(
      Counters.TARGET_COUNTER_ATTR,
      expression.key,
    );
    targetCounter.textContent = "3";
    root.appendChild(targetCounter);

    store.finishLastPage({ root, contentContainer: root });

    expect(targetCounter.textContent).toBe("2");
  });
});
