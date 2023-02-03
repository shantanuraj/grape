import { getIdFromLink } from "@/utils";
import { getPage } from "@/wiki";

export async function getMonsterList(): Promise<number[]> {
  const page = await getPage(315348);
  if (!page) return [];

  const monsterHeadingIds = ["hm_1", "hm_2", "hm_3", "hm_4"];
  const monsters: number[] = [];

  monsterHeadingIds.forEach((id) => {
    const table = page.querySelector(`#${id} ~ table`);
    if (!table)
      throw Error(`Could not find a table for the section with id ${id}`);

    const monsterLinks = Array.from(
      table.querySelectorAll<HTMLAnchorElement>("td a")
    );
    monsterLinks.forEach((l) => {
      const id = getIdFromLink(l.href);
      if (id) monsters.push(id);
    });
  });

  return monsters;
}
