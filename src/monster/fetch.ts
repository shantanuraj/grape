import { chunk, isEqual, merge } from "lodash";

import {
  AbnormalStatus,
  ABNORMAL_STATUSES,
  Element,
  ELEMENTS,
  KinsectExtract,
  KINSECT_EXTRACTS,
  MONSTER_ABNORMAL_STATUSES,
  MONSTER_ELEMENTAL_BLIGHTS,
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
  getHorizontalData,
  isHTMLTable,
} from "@/utils";
import { Monster, MonsterInfo, PageSection } from "./types";

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
  {
    text: "status effect",
    section: "statusEffects",
  },
  {
    text: "kinsect",
    section: "kinsectExtracts",
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

  /** Read monster info box */
  if (!isHTMLTable(data.info))
    throw Error("Could not find basic monster info table");

  const [nameRow, _, ...statsRows] = data.info.rows;

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

  /** Read weakness breakdown tables */
  if (!isHTMLTable(data.weaponWeakness) || !isHTMLTable(data.elementWeakness))
    throw Error("Could not find monster weakness tables");

  const weaknessBreakdown = getWeaknesses([
    data.weaponWeakness,
    data.elementWeakness,
  ]);

  /** Read status effects table */
  if (!isHTMLTable(data.statusEffects))
    throw Error("Could not find status effects table");

  const statusEffects = getStatusEffects(data.statusEffects);

  /** Read kinsect extracts */
  if (!isHTMLTable(data.kinsectExtracts))
    throw Error("Could not find kinsect extracts table");

  const kinsectExtracts = getKinsectExtracts(data.kinsectExtracts);

  const monster: Monster = {
    ...info,
    weaknessBreakdown,
    statusEffects,
    kinsectExtracts,
  };

  console.log(monster);

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
    if (
      !isEqual(attackTypes.sort(), [...WEAPON_DAMAGE_TYPES, ...ELEMENTS].sort())
    )
      return false;

    // all damage values should be integers
    const damage = Object.values(breakdown);
    if (damage.find((i) => !Number.isInteger(i))) return false;
  });

  return true;
};

const getStatusEffects = (
  table: HTMLTableElement
): Monster["statusEffects"] => {
  const data = getHorizontalData<number>(
    table,
    (header) => toCamel(header),
    (value) => (value.textContent ?? "").split("★").length - 1
  );

  if (isStatusEffects(data)) return data;
  throw Error("Error parsing status effect information");
};

const isStatusEffects = (
  data: Record<string, number>
): data is Monster["statusEffects"] => {
  // table should have all possible monster status effects
  const monsterStatusEffects = [
    ...MONSTER_ELEMENTAL_BLIGHTS,
    ...MONSTER_ABNORMAL_STATUSES,
  ];
  if (!isEqual(Object.keys(data).sort(), monsterStatusEffects.sort()))
    return false;

  // all effectiveness values should be integers
  const effectiveness = Object.values(data);
  if (effectiveness.find((i) => !Number.isInteger(i))) return false;

  // all effectiveness values should be in the range 0 - 3
  if (effectiveness.find((i) => i < 0 || i > 3)) return false;

  return true;
};

const getKinsectExtracts = (
  table: HTMLTableElement
): Monster["kinsectExtracts"] => {
  const [_, ...rows] = table.rows;

  const data: Monster["kinsectExtracts"] = {
    white: [],
    orange: [],
    red: [],
  };

  rows.forEach((row) => {
    const part = toCleanText(row.cells[0]);

    const images = row.cells[1].getElementsByTagName("img");
    if (!images.length) return;
    const extract = toCamel(images[0].alt.split(" ")[0]);

    if (isExtract(extract)) data[extract].push(part);
  });

  return data;
};

const isExtract = (colour: string): colour is KinsectExtract =>
  KINSECT_EXTRACTS.includes(colour);

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
