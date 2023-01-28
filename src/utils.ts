import { camelCase } from "lodash";

/**
 * Get an element's text content, with line breaks and extra whitespace removed.
 * @param el HTML element
 * @returns string with text content from the element, or empty string
 */
export function toCleanText(el: HTMLElement): string {
  const brs = Array.from(el.querySelectorAll("br"));
  brs.forEach((br) => br.replaceWith("\n"));
  return el.textContent?.trim() || "";
}

type TabTable = {
  name: string;
  table: HTMLTableElement;
};

/**
 * Gets a (single) table for a wiki section. Table must be immediately below heading.
 * @param page document
 * @param id HTML id of the section
 * @returns an array of TabTable objects (containing the tab name and table)
 */
export const getTableForId = (
  page: Document,
  id: string
): HTMLTableElement | null | undefined => {
  const nextElement =
    page.getElementById(id)?.parentElement?.nextElementSibling;

  if (nextElement?.className.includes("wikitable"))
    return <HTMLTableElement>nextElement;

  return nextElement?.querySelector<HTMLTableElement>("table.wikitable");
};

/**
 * Gets all tab tables for a wiki section. Table must be immediately below heading.
 * @param page document
 * @param id HTML id of the section
 * @returns an array of TabTable objects (containing the tab name and table)
 */
export const getTablesForId = (page: Document, id: string): TabTable[] => {
  const tabs = page
    .getElementById(id)
    ?.parentElement?.nextElementSibling?.querySelector<HTMLElement>(
      ".tabs.tabs-tabbox"
    );

  const labelEls = tabs?.querySelectorAll("label[data-tabpos]");

  const tables = Array.from(labelEls || []).map((el) => {
    const id = parseInt(el.getAttribute("data-tabpos")!);
    return {
      name: el.textContent!,
      table: page.querySelector<HTMLTableElement>(
        `.tabs-content-${id} table.wikitable`
      )!,
    };
  });

  return tables;
};

/**
 * Convert a string or element's text content to camelCase
 * @param el HTML element
 * @returns camelCase string
 */
export function toCamel(input: HTMLElement | string): string {
  if (typeof input === "string") return camelCase(input.trim());
  return camelCase(input.textContent?.trim());
}

/**
 * Get a list of rows where the given column includes a tick (✔)
 * @param table table element
 * @param column name of column to check for ticks
 * @returns array of strings (text content of column 1 for each matching row)
 */
export function getTickedRows(
  table: HTMLTableElement,
  column: string
): string[] {
  const [header, ...rows] = table.rows;
  const headerNames = Array.from(header.cells).map(toCamel);

  const columnIndex = headerNames.findIndex((i) => i === toCamel(column));
  if (columnIndex === -1) return [];

  const keys = Array.from(rows).map((row) => toCleanText(row.cells[0]));
  const values = Array.from(rows).map((row) =>
    toCleanText(row.cells[columnIndex])
  );

  return keys.filter((k, i) => values[i].includes("✔"));
}
