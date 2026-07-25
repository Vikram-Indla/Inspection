import type { Page } from "@playwright/test";
import type {
  GeometrySnapshot,
  StructuralAssertion,
} from "./types";

const ROUND = (value: number) => Math.round(value * 100) / 100;

export async function captureGeometry(
  page: Page,
  locale: string,
): Promise<GeometrySnapshot> {
  return page.evaluate(({ locale }) => {
    const round = (value: number) => Math.round(value * 100) / 100;
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };
    const numbers = (values: number[]) =>
      values.filter(Number.isFinite).map(round).sort((a, b) => a - b);
    const median = (values: number[]) => {
      const ordered = numbers(values);
      if (!ordered.length) return null;
      const middle = Math.floor(ordered.length / 2);
      return ordered.length % 2
        ? ordered[middle]
        : round((ordered[middle - 1] + ordered[middle]) / 2);
    };
    const elements = [...document.querySelectorAll("body *")].filter(visible);
    const cardCandidates = elements.filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width >= 120 && rect.height >= 48 &&
        (style.borderTopStyle !== "none" || style.boxShadow !== "none") &&
        parseFloat(style.borderTopLeftRadius) >= 4;
    });
    const radii = cardCandidates.map(element =>
      parseFloat(getComputedStyle(element).borderTopLeftRadius),
    );
    const broadContainers = elements.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= document.documentElement.clientWidth * 0.6 && rect.height >= 80;
    });
    const inlinePadding = broadContainers.flatMap(element => {
      const style = getComputedStyle(element);
      return [parseFloat(style.paddingInlineStart), parseFloat(style.paddingInlineEnd)];
    }).filter(value => value > 0);
    const blockPadding = broadContainers.flatMap(element => {
      const style = getComputedStyle(element);
      return [parseFloat(style.paddingBlockStart), parseFloat(style.paddingBlockEnd)];
    }).filter(value => value > 0);
    const layoutElements = elements.filter(element => {
      const display = getComputedStyle(element).display;
      return display === "grid" || display === "flex";
    });
    const gaps = layoutElements.flatMap(element => {
      const style = getComputedStyle(element);
      return [parseFloat(style.rowGap), parseFloat(style.columnGap)];
    }).filter(value => value > 0);
    const finiteMaxWidths = elements.map(element => {
      const maxWidth = getComputedStyle(element).maxWidth;
      return maxWidth === "none" ? NaN : parseFloat(maxWidth);
    }).filter(value => Number.isFinite(value) && value > 0);
    const controls = elements.filter(element =>
      element.matches("button, a[href], input, select, textarea, [role=button]"),
    );
    const controlHeights = controls.map(element => element.getBoundingClientRect().height);
    const grids = layoutElements.filter(element => getComputedStyle(element).display === "grid");
    const gridColumns = grids.map(element => {
      const columns = getComputedStyle(element).gridTemplateColumns;
      return columns === "none" ? 0 : columns.split(/\s+/).filter(Boolean).length;
    }).filter(value => value > 0);
    const styleText = [...document.styleSheets].map(sheet => {
      try {
        return [...sheet.cssRules].map(rule => rule.cssText).join("\n");
      } catch {
        return "";
      }
    }).join("\n");
    const direction = getComputedStyle(document.documentElement).direction ||
      getComputedStyle(document.body).direction;
    const minControlHeight = controlHeights.length ? Math.min(...controlHeights) : null;
    const metrics = [
      {
        name: "card-border-radius",
        applicable: radii.length > 0,
        value: median(radii),
        evidence: `${radii.length} bordered card candidates`,
      },
      {
        name: "container-padding",
        applicable: inlinePadding.length > 0 || blockPadding.length > 0,
        value: [median(inlinePadding) ?? 0, median(blockPadding) ?? 0],
        evidence: `${broadContainers.length} broad containers; [inline, block] median`,
      },
      {
        name: "layout-gap",
        applicable: gaps.length > 0,
        value: median(gaps),
        evidence: `${layoutElements.length} grid/flex containers`,
      },
      {
        name: "content-max-width",
        applicable: finiteMaxWidths.length > 0,
        value: finiteMaxWidths.length ? round(Math.max(...finiteMaxWidths)) : null,
        evidence: `${finiteMaxWidths.length} finite computed max-width values`,
      },
      {
        name: "breakpoint-topology",
        applicable: gridColumns.length > 0,
        value: [
          gridColumns.length ? Math.max(...gridColumns) : 0,
          document.body.scrollWidth > document.documentElement.clientWidth + 1 ? 1 : 0,
        ],
        evidence: "[maximum computed grid columns, horizontal overflow flag]",
      },
      {
        name: "touch-target-safe-area",
        applicable: controls.length > 0,
        value: [
          minControlHeight === null ? 0 : round(minControlHeight),
          /safe-area-inset-(?:top|right|bottom|left)/.test(styleText) ? 1 : 0,
        ],
        evidence: `${controls.length} visible controls; [minimum height, safe-area CSS declared]`,
      },
    ];
    return {
      url: location.href,
      title: document.title,
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      locale,
      direction,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.documentElement.clientWidth,
      unresolvedTemplateCount: document.querySelectorAll(".sc-missing,.sc-unresolved").length,
      runtimeErrorCount: document.querySelectorAll(".sc-logic-error").length,
      metrics,
    };
  }, { locale });
}

function numericMatch(shipped: number, design: number): boolean {
  const tolerance = Math.max(1, Math.abs(design) * 0.02);
  return Math.abs(shipped - design) <= tolerance;
}

function compareValue(
  shipped: number | string | number[] | null,
  design: number | string | number[] | null,
): boolean {
  if (typeof shipped === "number" && typeof design === "number") {
    return numericMatch(shipped, design);
  }
  if (Array.isArray(shipped) && Array.isArray(design) && shipped.length === design.length) {
    return shipped.every((value, index) =>
      index === shipped.length - 1 && shipped.length === 2 &&
      Number.isInteger(value) && Number.isInteger(design[index])
        ? value === design[index]
        : numericMatch(value, design[index]),
    );
  }
  return shipped === design;
}

export function compareGeometry(
  shipped: GeometrySnapshot,
  design: GeometrySnapshot,
): StructuralAssertion[] {
  return design.metrics.map(designMetric => {
    const shippedMetric = shipped.metrics.find(metric => metric.name === designMetric.name);
    if (!designMetric.applicable) {
      return {
        metric: designMetric.name,
        passed: false,
        applicable: false,
        shipped: shippedMetric?.value ?? null,
        design: designMetric.value,
        rule: "N/A only because the design exposes no measurable instance",
      };
    }
    if (!shippedMetric?.applicable) {
      return {
        metric: designMetric.name,
        passed: false,
        applicable: true,
        shipped: null,
        design: designMetric.value,
        rule: "design-specified geometry missing from shipped route",
      };
    }
    const categorical =
      designMetric.name === "breakpoint-topology" ||
      designMetric.name === "touch-target-safe-area";
    const passed = designMetric.name === "breakpoint-topology"
      ? JSON.stringify(shippedMetric.value) === JSON.stringify(designMetric.value)
      : compareValue(shippedMetric.value, designMetric.value);
    return {
      metric: designMetric.name,
      passed,
      applicable: true,
      shipped: shippedMetric.value,
      design: designMetric.value,
      rule: categorical
        ? "categorical values exact; numeric values within max(1px, 2%)"
        : "numeric values within max(1px, 2%)",
    };
  });
}

export function structuralScore(assertions: StructuralAssertion[]): number | null {
  const applicable = assertions.filter(assertion => assertion.applicable);
  if (applicable.length < 4) return null;
  return ROUND(100 * applicable.filter(assertion => assertion.passed).length / applicable.length);
}

export async function bitmapDifferencePercent(
  page: Page,
  shippedPng: Buffer,
  designPng: Buffer,
): Promise<number> {
  return page.evaluate(async ({ shipped, design }) => {
    const decode = async (base64: string) => {
      const response = await fetch(`data:image/png;base64,${base64}`);
      return createImageBitmap(await response.blob());
    };
    const [left, right] = await Promise.all([decode(shipped), decode(design)]);
    const width = Math.min(left.width, right.width);
    const height = Math.min(left.height, right.height);
    const canvas = new OffscreenCanvas(width * 2, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D canvas unavailable for bitmap comparison");
    context.drawImage(left, 0, 0, width, height);
    context.drawImage(right, width, 0, width, height);
    const leftData = context.getImageData(0, 0, width, height).data;
    const rightData = context.getImageData(width, 0, width, height).data;
    let changed = 0;
    for (let index = 0; index < leftData.length; index += 4) {
      const delta =
        Math.abs(leftData[index] - rightData[index]) +
        Math.abs(leftData[index + 1] - rightData[index + 1]) +
        Math.abs(leftData[index + 2] - rightData[index + 2]) +
        Math.abs(leftData[index + 3] - rightData[index + 3]);
      if (delta > 32) changed += 1;
    }
    return Math.round((changed / (width * height)) * 10000) / 100;
  }, {
    shipped: shippedPng.toString("base64"),
    design: designPng.toString("base64"),
  });
}
