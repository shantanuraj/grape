import { camelCase } from "lodash";

/**
 * Get an element's text content, with line breaks and extra whitespace removed.
 * @param el HTML element
 * @returns Cleaned text content from element
 */
export function cleanLines(el: HTMLElement): string {
  const brs = Array.from(el.querySelectorAll("br"));
  brs.forEach((br) => br.replaceWith("\n"));
  return el.textContent?.trim() || "";
}

type TabTable = {
  name: string;
  table: HTMLTableElement;
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
 * Converts an element's text to camelCase
 * @param el HTML element
 * @returns camelCase string
 */
export function toCamel(el: HTMLElement): string {
  return camelCase(el.textContent?.trim());
}
