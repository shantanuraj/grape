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
          (cell) => cell.textContent?.trim() || ""
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
  resist: identity,
  status: identity,
  threatLv: (val) => parseInt(val.split(" / ")[0]),
  type: identity,
  weak: (val) => (val === "—" ? undefined : val),
};

const nodeContentsWithText = (
  page: Document,
  text: string,
  root: HTMLElement
) => {
  return (
    page
      .evaluate(`//b[contains(text(),'${text}: ')]`, root, null, 9, null)
      ?.singleNodeValue?.parentElement?.textContent?.replace(`${text}: `, "") ||
    ""
  );
};
