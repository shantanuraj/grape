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
