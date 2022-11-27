import { JSDOM } from "jsdom";

import { Monster, MonsterStats } from "@/types";
import { getPage } from "@/wiki";
import { camelCase, chunk } from "lodash";

export async function getMonster(name: string): Promise<Monster | undefined> {
  const html = await getPage("monster", name);
  if (!html) return;
  const dom = new JSDOM(html);
  const page = dom.window.document;

  try {
    const infoTable = page.querySelector<HTMLTableElement>("table.wikitable")!;
    const [_, imageRow, ...statsRows] = infoTable.rows;

    const cells = chunk(
      statsRows.flatMap((row) => {
        return Array.from(row.cells).map(
          (cell) => {
            // Get line breaks out of the way
            const brs = Array.from(cell.querySelectorAll("br"));
            brs.forEach((br) => br.replaceWith("\n"));
            return cell.textContent?.trim() || ""
          }
        );
      }),
      2
    );

    const stats = Object.fromEntries(
      cells.map(([key, value]) => {
        const parsedKey = camelCase(key) as keyof MonsterStats;
        const parsedValue = parsers[parsedKey](value);
        return [parsedKey, parsedValue];
      })
    ) as unknown as MonsterStats;

    const intro = page.getElementById("Introduction")!;

    const description = nodeContentsWithText(page, "Description", intro);
    const hunterTips = nodeContentsWithText(page, "Hunter tips", intro);

    const monster: Monster = {
      name,
      image: imageRow.querySelector("img")!.src,
      description,
      hunterTips,
      habitats: [],
      ...stats,
    };

    return monster;
  } catch (err) {
    console.error(err);
    return;
  }
}

const identity = <T>(x: T) => x;

const parsers: Record<
  keyof MonsterStats,
  (value: string) => MonsterStats[keyof MonsterStats]
> = {
  element: identity,
  resist: val => val.split("\n"),
  status: identity,
  threatLv: (val) => parseInt(val.split(" / ")[0]),
  type: val => val.split("\n"),
  weak: (val) => (val === "—" ? undefined : val),
};

const FIRST_ORDERED_NODE_TYPE = 9;

const nodeContentsWithText = (
  page: Document,
  text: string,
  root: HTMLElement
) => {
  return (
    page
      .evaluate(`//b[contains(text(),'${text}: ')]`, root, null, FIRST_ORDERED_NODE_TYPE, null)
      ?.singleNodeValue?.parentElement?.textContent?.replace(`${text}: `, "").trim() ||
    ""
  );
};
