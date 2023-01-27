import { JSDOM } from "jsdom";
import { camelCase, chunk } from "lodash";

import {
  Material,
  MaterialsByRank,
  Monster,
  MonsterStats,
  PhasedWeakness,
  Rank,
} from "@/types";
import { getPage } from "@/wiki";
import { cleanLines, getTableForId, getTablesForId, toCamel } from "@/utils";

export async function getMonster(name: string): Promise<Monster | undefined> {
  const html = await getPage(name, "monster");
  if (!html) return;
  const dom = new JSDOM(html);
  const page = dom.window.document;

  try {
    const infoTable = page.querySelector<HTMLTableElement>("table.wikitable")!;
    const [_, imageRow, ...statsRows] = infoTable.rows;

    const cells = chunk(
      statsRows.flatMap((row) => {
        return Array.from(row.cells).map(cleanLines);
      }),
      2
    );

    const cellData = Object.fromEntries(cells);

    const stats: MonsterStats = {
      type: readLines(cellData["Type"])[0],
      class: readLines(cellData["Type"])[1],
      threatLv: parseInt(cellData["Threat lv"].split(" / ")[0]),
      element: cellData["Element"],
      status: readLines(cellData["Status"]),
      resist: readLines(cellData["Resist"]),
      weak: cellData["Weak"] === "—" ? undefined : readLines(cellData["Weak"]),
    };

    const intro = page.getElementById("Introduction")!;

    const description = nodeContentsWithText(page, "Description", intro);
    const hunterTips = nodeContentsWithText(page, "Hunter tips", intro);

    const monster: Monster = {
      name,
      image: imageRow.querySelector("img")!.src,
      description,
      hunterTips,
      habitats: [],
      weaknesses: getWeaknesses(page),
      kinsect: getKinsectData(page),
      breakeable: [],
      severable: [],
      materials: getMaterials(page),
      ...stats,
    };

    return monster;
  } catch (err) {
    console.error(err);
    return;
  }
}

const identity = <T>(x: T) => x;
const readLines = (text: string) => text.split("\n").map((l) => l.trim());

const FIRST_ORDERED_NODE_TYPE = 9;

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
        FIRST_ORDERED_NODE_TYPE,
        null
      )
      ?.singleNodeValue?.parentElement?.textContent?.replace(`${text}: `, "")
      .trim() || ""
  );
};

const getTablesForHeading = (page: Document, heading: string) => {
  return Array.from(
    page
      .getElementById(heading)
      ?.parentElement?.nextElementSibling?.querySelectorAll<HTMLTableElement>(
        ".tabs-container .tabs-content table"
      ) || []
  );
};

const getWeaknesses = (page: Document): Monster["weaknesses"] => {
  const weaknessTables = getTablesForId(page, "Weaknesses_by_hitzone");

  const weaknesses = Object.fromEntries(
    weaknessTables.map((table) => {
      const [header, ...rows] = table.table.rows;
      const elements = Array.from(header.cells).slice(1).map(toCamel);

      const weaknessData = Object.fromEntries(
        rows.map((row) => {
          const [monsterPart, ...damageValues] = Array.from(row.cells);
          const part = toCamel(monsterPart);
          const weaknessesForPart = Object.fromEntries(
            elements.map((element, i) => {
              const weakness = parseInt(
                damageValues[i].textContent?.trim() || "0"
              );
              return [element, weakness];
            })
          );
          return [part, weaknessesForPart];
        })
      );

      return [table.name, weaknessData];
    })
  ) as PhasedWeakness;

  return weaknesses;
};

const getKinsectData = (page: Document): Monster["kinsect"] => {
  const kinsectData: Monster["kinsect"] = {
    white: [],
    orange: [],
    red: [],
  };

  const partTable = getTableForId(page, "Monster_part_data");
  if (!partTable) return kinsectData;

  const [header, ...rows] = partTable.rows;

  const kinsectColumn = Array.from(header.cells)
    .map(toCamel)
    .findIndex((i) => i === "kinsectExtract");

  if (kinsectColumn > 0) {
    rows.forEach((row) => {
      const part = row.cells[0].textContent!.trim();
      const extract = row.cells[kinsectColumn]
        .textContent!.trim()
        .toLowerCase();

      if (["white", "orange", "red"].includes(extract))
        kinsectData[extract as "white" | "orange" | "red"].push(part);
    });
  }

  return kinsectData;
};

const getMaterials = (page: Document): Monster["materials"] => {
  const tables = getTablesForHeading(page, "Monster_materials");
  const ranks = Array.from(
    tables[0].closest("div.tabs")?.querySelectorAll("label") || []
  )
    .map((l) => l.textContent?.slice(0, 2))
    .filter((r): r is Rank => !!r);

  const result = Object.fromEntries(
    ranks.map((rank, i) => {
      const table = tables[i];

      const [header, ...rows] = table.rows;
      const materialFields = Array.from(header.cells)
        .slice(1)
        .map(toCamel) as (keyof Material)[];

      const materials = rows.map((row) => {
        const [materialEmblem, ...materialValues] = Array.from(row.cells);

        return Object.fromEntries([
          ["emblem", materialEmblem.querySelector("img")?.src || ""],
          ...materialFields.map((field, i) => {
            const cell = materialValues[i];
            // Get line breaks out of the way
            const brs = Array.from(cell.querySelectorAll("br"));
            brs.forEach((br) => br.replaceWith("\n"));
            const value = materialParsers[field](
              cell.textContent?.trim() || ""
            );
            return [field, value] as const;
          }),
        ]) as unknown as Material;
      });

      return [rank, materials] as const;
    })
  ) as MaterialsByRank;

  return result;
};

const readPercentage = (text: string) => parseInt(text.replace("%", ""));

const readScopedPercentage = <T extends string>(
  text: string
): Record<T, { amount: number }> | undefined => {
  if (!text) return undefined;
  return Object.fromEntries(
    text.split("\n").map((l) => {
      const [chance, scope = ""] = l.split("%");
      return [camelCase(scope.slice(1, -1)) as T, { amount: parseInt(chance) }];
    })
  ) as Record<T, { amount: number }>;
};

const materialParsers: {
  [key in keyof Required<Material>]: (value: string) => Material[key];
} = {
  emblem: identity,
  materialName: identity,
  nameJaZh: readLines,
  target: readPercentage,
  carve: readScopedPercentage,
  capture: readPercentage,
  partBreak: readScopedPercentage,
  drop: readScopedPercentage,
  palico: readPercentage,
};
