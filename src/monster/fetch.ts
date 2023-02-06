import { camelCase, chunk, isEqual, merge } from "lodash";

import {
  AbnormalStatus,
  ABNORMAL_STATUSES,
  Element,
  ELEMENTS,
  WEAPON_DAMAGE_TYPES,
} from "@/types";
import { getPage } from "@/wiki";
import {
  toCleanText,
  getMatchingItems,
  readLines,
  getAllDataTables,
  getSection,
  toCamel,
  getTableRows,
} from "@/utils";
import { Monster, MonsterInfo, PageSection, Weakness } from "./types";

const sectionLookup: { text: string; section: PageSection }[] = [
  {
    text: "weakness and notes",
    section: "info",
  },
  {
    text: "weapon damage breakdown",
    section: "weaponWeakness",
  },
  {
    text: "elemental weakness breakdown",
    section: "elementWeakness",
  },
];

export async function getMonster(id: number): Promise<Monster | undefined> {
  const page = await getPage(id);
  if (!page) return;

  const allTables = getAllDataTables(page);

  const data: Partial<Record<PageSection, HTMLElement>> = {};
  allTables.forEach(([heading, table]) => {
    const section = getSection(sectionLookup, heading);
    if (section) data[section] = table;
  });

  /**
   * Read info from the info box table
   */
  const [nameRow, _, ...statsRows] = (data.info as HTMLTableElement).rows;

  const infoCells = chunk(
    statsRows.flatMap((row) => {
      return Array.from(row.cells).map(toCleanText);
    }),
    2
  );

  const cellData = Object.fromEntries(infoCells);

  const info: MonsterInfo = {
    name: nameRow.querySelector("th span")!.textContent!,
    description: cellData["Characteristics"],
    class: cellData["Type"],
    threatLevel: parseInt(cellData["Threat Level"].split(" / ")[0]),
    majorWeakness: getMatchingItems<Element>(
      ELEMENTS,
      readLines(cellData["Major Weakness"])
    ),
    otherWeakness: getMatchingItems<Element>(
      ELEMENTS,
      readLines(cellData["Other Weakness"])
    ),
    element: getMatchingItems<Element>(
      ELEMENTS,
      readLines(cellData["Blight / Elemental Damage"])
    ),
    abnormalStatus: getMatchingItems<AbnormalStatus>(
      ABNORMAL_STATUSES,
      readLines(cellData["Abnormal Status"])
    ),
  };

  /**
   * Read info from the weakness breakdowns
   */
  const weaknessToAttack = data.weaponWeakness as HTMLTableElement;
  const weaknessToElement = data.elementWeakness as HTMLTableElement;
  const weaknessBreakdown = getWeaknesses([
    weaknessToAttack,
    weaknessToElement,
  ]);

  const monster: Monster = {
    ...info,
    weaknessBreakdown,
  };

  // console.log(monster);

  // const [kinsect, breakable, severable] = getMonsterPartData(page);

  // const monster: Monster = {
  //   name: monsterName,
  //   image: imageRow.querySelector("img")!.src,
  //   description,
  //   hunterTips,
  //   habitats: [],
  //   weaknesses: getWeaknesses(page),
  //   ailments: getAilments(page),
  //   kinsect,
  //   breakable,
  //   severable,
  //   items: getEffectiveItems(page),
  //   quests: getQuests(page),
  //   materials: getMaterials(page),
  //   ...stats,
  // };

  return monster;
}

const identity = <T>(x: T) => x;

const getWeaknesses = (
  tables: [HTMLTableElement, HTMLTableElement]
): Monster["weaknessBreakdown"] => {
  const [weaponData, elementData] = tables.map((table) =>
    getTableRows<number>(
      table,
      (headerCell) => {
        if (headerCell.textContent) return toCamel(headerCell.textContent);

        const images = headerCell.getElementsByTagName("img");
        if (images.length) return toCamel(images[0].alt.split(" ")[0]);

        return "No header text";
      },
      (cell) => {
        const text = cell.textContent ?? "";
        return text.match(/^\d+$/) ? parseInt(text) : 0;
      }
    )
  );

  const weaknessBreakdown = merge(weaponData, elementData);

  if (isWeaknessBreakdown(weaknessBreakdown)) return weaknessBreakdown;
  throw Error("Error in processing monster weakness data");
};

const isWeaknessBreakdown = (data: {
  [row: string]: { [column: string]: number };
}): data is Monster["weaknessBreakdown"] => {
  // there should be an "overall" weakness row
  const parts = Object.keys(data);
  if (!parts.includes("overall")) return false;

  const breakdowns = Object.values(data);
  breakdowns.forEach((breakdown) => {
    // each part should contain data for each element
    const attackTypes = Object.keys(breakdown);
    if (!isEqual(attackTypes, [...WEAPON_DAMAGE_TYPES, ...ELEMENTS]))
      return false;

    // all damage values shoudl be integers
    const damage = Object.values(breakdown);
    if (damage.find((i) => !Number.isInteger(i))) return false;
  });

  return true;
};

// const getKinsectData = (table: HTMLTableElement): Monster["kinsect"] => {
//   const [header, ...rows] = table.rows;

//   const kinsectColumn = Array.from(header.cells)
//     .map(toCamel)
//     .findIndex((i) => i === "kinsectExtract");
//   if (kinsectColumn === -1) return;

//   const kinsectData: Monster["kinsect"] = {
//     white: [],
//     orange: [],
//     red: [],
//   };
//   rows.forEach((row) => {
//     const part = toCleanText(row.cells[0]);
//     const extract = toCamel(row.cells[kinsectColumn]);

//     if (["white", "orange", "red"].includes(extract))
//       kinsectData[extract as KinsectExtract].push(part);
//   });

//   return kinsectData;
// };

// const getMonsterPartData = (
//   page: Document
// ): [Monster["kinsect"], Monster["breakable"], Monster["severable"]] => {
//   const partTable = getTableForId(page, "Monster_part_data");
//   if (!partTable) return [undefined, [], []];

//   const kinsect = getKinsectData(partTable);
//   const breakeable = getTickedRows(partTable, "breakable");
//   const severable = getTickedRows(partTable, "severable");

//   return [kinsect, breakeable, severable];
// };

// const getEffectiveItems = (page: Document): Monster["items"] => {
//   const table = getTableForId(page, "Item_effectiveness");
//   if (!table) return [];

//   const effectiveItems: string[] = [];
//   const itemRows = chunk(Array.from(table.rows), 2);
//   itemRows.forEach((rows) => {
//     const items = Array.from(rows[0].cells).map(toCleanText);
//     const effectiveness = Array.from(rows[1].cells).map(toCamel);

//     items.forEach((item, i) => {
//       if (effectiveness[i].includes("✔")) effectiveItems.push(item);
//     });
//   });

//   return effectiveItems;
// };

// const getQuests = (page: Document): Monster["quests"] => {
//   const tables = getTablesForId(page, "Relevant_quests");

//   const quests: Monster["quests"] = [];
//   tables.forEach((table) => {
//     const [header, ...rows] = table.table.rows;

//     const headerNames = Array.from(header.cells).map(toCamel);
//     const columnNames = [
//       "type",
//       ["level", "star"],
//       "questName",
//       "locale",
//       "isTarget",
//     ];

//     const columnLookup = Object.fromEntries(
//       columnNames.map((name) => [
//         typeof name === "string" ? name : name[0],
//         headerNames.indexOf(
//           typeof name === "string"
//             ? name
//             : name.filter((n) => headerNames.includes(n))[0]
//         ),
//       ])
//     );

//     rows.forEach((row) => {
//       const rowData = Array.from(row.cells).map(toCleanText);
//       if (rowData[columnLookup["isTarget"]].toLowerCase() === "yes") {
//         quests.push({
//           type: rowData[columnLookup["type"]],
//           level: parseInt(rowData[columnLookup["level"]]),
//           name: rowData[columnLookup["questName"]],
//           locale: rowData[columnLookup["locale"]],
//         });
//       }
//     });
//   });

//   return quests;
// };

// const getMaterials = (page: Document): Monster["materials"] => {
//   const tables = getTablesForId(page, "Monster_materials");

//   const result = Object.fromEntries(
//     tables.map((table) => {
//       const materialTable = table.table;
//       const rank = table.name.slice(0, 2);

//       const [header, ...rows] = materialTable.rows;
//       const materialColumns = Array.from(header.cells)
//         .slice(1)
//         .map(toCamel) as (keyof Material)[];

//       const materials = rows.map((row) => {
//         const [materialEmblem, ...materialValues] = Array.from(row.cells);

//         const materialData = [
//           ["emblem", materialEmblem.querySelector("img")?.src || ""],
//           ...materialColumns.map((column, i) => {
//             const cell = toCleanText(materialValues[i]);
//             if (!cell) return undefined;
//             const value = materialParsers[column](cell);
//             return [column, value];
//           }),
//         ].filter(Boolean) as [string, any][];

//         return Object.fromEntries(materialData) as Material;
//       });

//       return [rank, materials] as const;
//     })
//   ) as MaterialsByRank;

//   return result;
// };

// /**
//  * Get the amount of times a material can be obtained if the text includes x[number], e.g. x2, x3
//  * @param text string to check
//  * @returns number or undefined
//  */
// const getMaterialAmount = (text: string): number | undefined => {
//   const matches = text.match(/.*x(\d).*/);

//   if (!matches) return;
//   return parseInt(matches[1]);
// };

// const readPercentage = (text: string) => {
//   const amount = getMaterialAmount(text);
//   return { percentage: parseInt(text.replace("%", "")), amount };
// };

// const readScopedPercentage = <T extends string>(
//   text: string
// ): Record<T, MaterialChance> | undefined => {
//   if (!text) return undefined;
//   return Object.fromEntries(
//     text.split("\n").map((l) => {
//       const [chance, scope = ""] = l.split("%");
//       return [
//         camelCase(scope.slice(1, -1)) as T,
//         { percentage: parseInt(chance) },
//       ];
//     })
//   ) as Record<T, { percentage: number }>;
// };

// const materialParsers: {
//   [key in keyof Required<Material>]: (value: string) => Material[key];
// } = {
//   emblem: identity,
//   materialName: identity,
//   nameJaZh: readLines,
//   target: readPercentage,
//   carve: readScopedPercentage,
//   capture: readPercentage,
//   partBreak: readScopedPercentage,
//   drop: readScopedPercentage,
//   palico: readPercentage,
// };
