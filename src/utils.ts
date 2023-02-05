import { camelCase } from "lodash";
import { BASE_URL } from "./wiki";

/**
 * Given a game8 wiki link, return the id
 * @param link string
 * @returns id number
 */
export const getIdFromLink = (link: string) => {
  const regex = new RegExp(`${BASE_URL}(\\d+)`);
  const match = link.match(regex);

  return match ? parseInt(match[1]) : null;
};

/**
 * Split lines of text in a single string into an array of lines
 * @param text string with line breaks
 * @returns text array
 */
export const readLines = (text: string) =>
  text.split("\n").map((l) => l.trim());

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
 * Get the text content each column of a table as an array.
 * Takes an optional function for extracting header and table data, otherwise returns text content.
 * @param table Table
 * @param keyParseFn Function for parsing the header (first row) and key (first column)
 * @param dataParseFn Function for parsing data
 * @returns Table keys and columns
 */
export const getTableColumns = <T>(
  table: HTMLTableElement,
  keyParseFn?: (c: HTMLTableCellElement) => string,
  dataParseFn?: (c: HTMLTableCellElement) => T
): {
  key: { header: string; data: string[] };
  columns: { header: string; data: T[] }[];
} => {
  const parseKey = keyParseFn
    ? keyParseFn
    : (c: HTMLTableCellElement) => c.textContent ?? "";
  const parseData = dataParseFn
    ? dataParseFn
    : (c: HTMLTableCellElement) => c.textContent ?? "";

  const [header, ...rows] = table.rows;

  const key = {
    header: parseKey(header.cells[0]),
    data: [] as string[],
  };

  const columns = [...header.cells].slice(1).map((c) => ({
    header: parseKey(c),
    data: [] as T[],
  }));

  rows.forEach((row) => {
    [...row.cells].forEach((cell, i) => {
      if (i === 0) {
        key.data.push(parseKey(cell));
        return;
      }
      columns[i - 1].data.push(parseData(cell) as T);
    });
  });

  return { key, columns };
};

/**
 * Get the index of a column in an array produced by the getTableColumns function above
 * @param array Array of table columns
 * @param header Header text to search for
 * @returns Index or -1
 */
export const getColumnIndex = (
  array: { columns: { header: string }[] },
  header: string
): number => array.columns.findIndex((column) => column.header === header);

/**
 * Turn a horizontal table (heading row, data row, heading row, data row...) into a
 * data object.
 * @param table Horizontal table to be converted
 * @returns object with heading text as keys, and cell text as values
 */
export const getHorizontalData = (
  table: HTMLTableElement
): Record<string, string> => {
  const headings: string[] = [...table.rows].reduce(
    (acc, row, i) => {
      // WIP
      console.log([...row.cells].map((c) => toCleanText(c)));
      // i % 0 ? [...acc] : [...acc, ...row.cells.map((c) => toCleanText(c))];

      return [...acc];
    },

    []
  );

  // const headings: string[] = [];
  // const data: string[] = [];

  // [...table.rows].forEach((row, i) => {
  //   console.log(row.cells[0].textContent!, i);
  //   if (i % 0) {
  //     console.log("data");
  //     data.concat([...row.cells].map((c) => toCleanText(c)));
  //     return;
  //   }
  //   console.log("heading");
  //   headings.concat([...row.cells].map((c) => toCleanText(c)));
  // });
  // console.log(headings, data);

  // return headings.reduce(
  //   (acc, heading, i) => ({ ...acc, [heading]: data[i] }),
  //   {}
  // );
  return { a: "b" };
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
 * Get all headings that are followed by a table or tab table.
 * @param page The parent element to scan for data in
 * @returns array of headings and their associated table
 */
export const getAllDataTables = (
  page: HTMLElement
): [string, HTMLElement][] => {
  const allData: [string, HTMLElement][] = [];
  page
    .querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6")
    .forEach((heading) => {
      const nextElement = heading.nextElementSibling as HTMLElement;
      if (!nextElement) return;

      if (
        nextElement.tagName === "TABLE" ||
        (nextElement.tagName === "DIV" &&
          nextElement.className.includes("a-tabContainer"))
      )
        allData.push([toCleanText(heading), nextElement]);
    });

  return allData;
};

/**
 * Get the data "section" a heading belongs to, based on the lookup array
 * @param sectionLookup An array of sections and the heading text for that section
 * @param heading The heading to look up
 * @returns the section or undefined
 */
export const getSection = <T>(
  sectionLookup: { text: string; section: T }[],
  heading: string
): T | undefined => {
  const lookup = sectionLookup.find((i) =>
    heading.toLowerCase().includes(i.text)
  );
  return lookup ? lookup.section : undefined;
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
type GetMatchingItemsType = {
  <T>(reference: readonly T[], input: string): T | undefined;
  <T>(reference: readonly T[], input: string[]): T[];
};
export const getMatchingItems: GetMatchingItemsType = <T extends string>(
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
