import { JSDOM } from "jsdom";

import { Monster } from "@/types";
import { getPage } from "@/wiki";

const nodeContentsWithText = (
  page: Document,
  text: string,
  root: HTMLElement
) => {
  return (
    page
      .evaluate(
        `//b[contains(text(),'${text}: ')]`,
        root,
        null,
        9,
        null
      )
      ?.singleNodeValue?.parentElement?.textContent?.replace(`${text}: `, "") ||
    ""
  );
};

export async function getMonster(name: string): Promise<Monster | undefined> {
  const html = await getPage("monster", name);
  if (!html) return;
  const dom = new JSDOM(html);
  const page = dom.window.document;

  try {
    const infoTable = page.querySelector<HTMLTableElement>("table.wikitable")!;
    const [_, imageRow, ...statsRows] = infoTable.rows;

    const intro = page.getElementById("Introduction")!;

    const description = nodeContentsWithText(page, "Description", intro);
    const hunterTips = nodeContentsWithText(page, "Hunter tips", intro);

    const monster: Monster = {
      name,
      image: imageRow.querySelector("img")!.src,
      description,
      hunterTips,
      habitats: [],
    };

    return monster;
  } catch (err) {
    console.error(err);
    return;
  }
}
