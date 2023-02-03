import { camelCase } from "lodash";
import { BASE_URL } from "./wiki";

export const getIdFromLink = (link: string) => {
  const regex = new RegExp(`${BASE_URL}(\\d+)`);
  const match = link.match(regex);

  return match ? parseInt(match[1]) : null;
};

/**
 * Get an element's text content, with line breaks and extra whitespace removed.
 * @param el HTML element
 * @returns string with text content from the element, or empty string
 */
export const toCleanText = (el: HTMLElement): string => {
  const brs = Array.from(el.querySelectorAll("br"));
  brs.forEach((br) => br.replaceWith("\n"));
  return el.textContent?.trim() || "";
};

/**
 * Get the element after a wiki section heading
 * @param page document
 * @param id section's id
 * @returns HTML element
 */
export const getElementAfterId = (
  page: Document,
  id: string
): HTMLElement | null | undefined =>
  page.getElementById(id)?.parentElement?.nextElementSibling as HTMLElement;

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
  const nextElement = getElementAfterId(page, id);

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
  const tabs = getElementAfterId(page, id)?.querySelector<HTMLElement>(
    ".tabs.tabs-tabbox"
  );

  const labelEls = tabs?.querySelectorAll("label[data-tabpos]");

  const tables = Array.from(labelEls || []).map((el) => {
    const id = parseInt(el.getAttribute("data-tabpos")!);
    return {
      name: el.textContent!,
      table: tabs?.querySelector<HTMLTableElement>(
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
export const toCamel = (input: HTMLElement | string): string => {
  if (typeof input === "string") return camelCase(input.trim());
  return camelCase(input.textContent?.trim());
};

/**
 * Get a list of rows where the given column includes a tick (✔)
 * @param table table element
 * @param column name of column to check for ticks
 * @returns array of strings (text content of column 1 for each matching row)
 */
export const getTickedRows = (
  table: HTMLTableElement,
  column: string
): string[] => {
  const [header, ...rows] = table.rows;
  const headerNames = Array.from(header.cells).map(toCamel);

  const columnIndex = headerNames.findIndex((i) => i === toCamel(column));
  if (columnIndex === -1) return [];

  const keys = Array.from(rows).map((row) => toCleanText(row.cells[0]));
  const values = Array.from(rows).map((row) =>
    toCleanText(row.cells[columnIndex])
  );

  return keys.filter((_, i) => values[i].includes("✔"));
};

/**
 * If a string is part of a reference array, get the reference item, or undefined if it is not.
 * For an array of strings, filter out elements which are not part of the reference array.
 *
 * Note: the reference item comparison uses startsWith() as some items can be shortened,
 * e.g. "ice" for "iceblight"
 *
 * @param list reference array
 * @param input item or array of items to check
 * @returns a string or array of strings matching the reference array's type
 */
type GetMatchingElementsType = {
  <T>(reference: readonly T[], input: string): T | undefined;
  <T>(reference: readonly T[], input: string[]): T[];
};
export const getMatchingElements: GetMatchingElementsType = <T extends string>(
  reference: readonly T[],
  input: string | string[]
) => {
  const getElementOrUndefined = (s: string) => {
    const cleanString = toCamel(s);
    if (!cleanString) return undefined;
    return reference.find((i) => i.startsWith(cleanString));
  };

  if (typeof input === "string") return getElementOrUndefined(input);

  return input.map(getElementOrUndefined).filter(Boolean) as T[];
};
