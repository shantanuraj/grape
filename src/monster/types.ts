import { AbnormalStatus, AttackType, Element, Rank } from "@/types";

export type PageSection =
  | "info"
  | "weaponWeakness"
  | "elementWeakness"
  | "statusEffects";

export type Monster = MonsterInfo &
  MonsterWeakness & {
    //   ailments: {
    //     [k in StatusEffect]: number;
    //   };
    //   kinsect?: Kinsect;
    //   breakable: string[];
    //   severable: string[];
    //   items: string[];
    //   quests: Quest[];
    //   materials: MaterialsByRank;
  };

export type MonsterInfo = {
  name: string;
  description: string;
  class: string;
  threatLevel: number;
  majorWeakness: Element[];
  otherWeakness: Element[];
  element: Element[];
  abnormalStatus: AbnormalStatus[];
};

// weakness breakdown - { head: { "sever": 45, blunt: "60" ... } }
type MonsterWeakness = { weaknessBreakdown: Record<string, Weakness> };

export type Weakness = Record<AttackType, number>;

export type MaterialChance = {
  amount?: number;
  percentage: number;
};

export interface Material {
  materialName: string;
  nameJaZh: string[];
  emblem: string;
  target?: MaterialChance;
  carve?: Record<string, MaterialChance>;
  capture?: MaterialChance;
  partBreak?: Record<string, MaterialChance>;
  drop?: {
    normal?: MaterialChance;
    riding?: MaterialChance;
  };
  palico?: MaterialChance;
}

export type MaterialsByRank = {
  [key in Rank]?: Material[];
};

// export type Kinsect = {
//     [key in KinsectExtract]: string[];
//   };
