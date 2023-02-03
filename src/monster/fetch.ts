import { camelCase, chunk } from "lodash";

import { AbnormalStatus, ABNORMAL_STATUSES, Element, ELEMENTS } from "@/types";
import { getPage } from "@/wiki";
import {
  toCleanText,
  getMatchingItems,
  readLines,
  getHorizontalData,
} from "@/utils";
import { Monster, MonsterInfo } from "./types";

export async function getMonster(id: number): Promise<Monster | undefined> {
  const page = await getPage(id);
  if (!page) return;

  /**
   * Read info from the info box table
   */
  const infoTable = page.querySelector<HTMLTableElement>("#hl_1 ~ table")!;
  const [nameRow, _, ...statsRows] = infoTable.rows;

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
   * Read info from the "Weakness and Resistance" section
   */
  const weaknessSummaryTable =
    page.querySelector<HTMLTableElement>("#hm_2 ~ table")!;
  const weaknessSummaryData = getHorizontalData(weaknessSummaryTable);
  console.log(weaknessSummaryData);

  const monster: Monster = {
    ...info,
  };
  // console.log(monster);

  // const intro = page.getElementById("Introduction")!;

  // const description = nodeContentsWithText(page, "Description", intro);
  // const hunterTips = nodeContentsWithText(page, "Hunter tips", intro);

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

// const getWeaknesses = (page: Document): Monster["weaknesses"] => {
//   const weaknessTables = getTablesForId(page, "Weaknesses_by_hitzone");

//   const weaknesses = Object.fromEntries(
//     weaknessTables.map((table) => {
//       const [header, ...rows] = table.table.rows;
//       const elements = Array.from(header.cells).slice(1).map(toCamel);

//       const weaknessData = Object.fromEntries(
//         rows.map((row) => {
//           const [monsterPart, ...damageValues] = Array.from(row.cells);
//           const part = toCamel(monsterPart);
//           const weaknessesForPart = Object.fromEntries(
//             elements.map((element, i) => {
//               const weakness = parseInt(
//                 damageValues[i].textContent?.trim() || "0"
//               );
//               return [element, weakness];
//             })
//           );
//           return [part, weaknessesForPart];
//         })
//       );

//       return [table.name, weaknessData];
//     })
//   ) as PhasedWeakness;

//   return weaknesses;
// };

// const getAilments = (page: Document): Monster["ailments"] => {
//   const section = getElementAfterId(page, "Status_effectiveness");
//   const labels = Array.from(
//     section?.querySelectorAll("label[data-tabpos]") ?? []
//   ).map((el) => el.textContent?.toLowerCase().trim());

//   const ailmentData = labels.map((l) => [
//     l?.replace(/[^A-Za-z]/g, ""),
//     l?.replace(/[A-Za-z]/g, "").length,
//   ]);

//   return Object.fromEntries(ailmentData) as Monster["ailments"];
// };

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
