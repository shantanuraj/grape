import { JSDOM } from "jsdom";
import { camelCase, chunk } from "lodash";

import {
  AttackType,
  HitzoneWeakness,
  Material,
  MaterialsByRank,
  Monster,
  MonsterPart,
  MonsterStats,
  Rank,
  Weakness,
} from "@/types";
import { getPage } from "@/wiki";

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
        return Array.from(row.cells).map((cell) => {
          // Get line breaks out of the way
          const brs = Array.from(cell.querySelectorAll("br"));
          brs.forEach((br) => br.replaceWith("\n"));
          return cell.textContent?.trim() || "";
        });
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
      weaknesses: getWeaknesses(page),
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

const parsers: {
  [key in keyof Required<MonsterStats>]: (value: string) => MonsterStats[key];
} = {
  element: identity,
  resist: readLines,
  status: identity,
  threatLv: (val) => parseInt(val.split(" / ")[0]),
  type: readLines,
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
  const tables = getTablesForHeading(page, "Weaknesses_by_hitzone");

  const result = tables.map((table) => {
    const [header, ...rows] = table.rows;
    const attackTypes = Array.from(header.cells)
      .slice(1)
      .map((cell) => {
        const attackType = camelCase(cell.textContent?.trim()) as AttackType;
        return attackType;
      });

    return Object.fromEntries(
      rows.map((row) => {
        const [partName, ...weaknesses] = Array.from(row.cells);
        const part = camelCase(partName.textContent?.trim()) as MonsterPart;
        const weaknessesForPart = Object.fromEntries(
          attackTypes.map((attackType, i) => {
            const weakness = parseInt(weaknesses[i].textContent?.trim() || "0");
            return [attackType, weakness];
          })
        ) as Weakness;
        return [part, weaknessesForPart] as const;
      })
    ) as HitzoneWeakness;
  });

  return result;
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
        .map((cell) => {
          const field = camelCase(cell.textContent?.trim()) as keyof Material;
          return field;
        });

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
