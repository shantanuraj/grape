import {
  AbnormalStatus,
  AttackType,
  Element,
  KinsectExtract,
  MONSTER_ABNORMAL_STATUSES,
  MONSTER_ELEMENTAL_BLIGHTS,
  Rank,
} from "@/types";

export type PageSection =
  | "info"
  | "weaponWeakness"
  | "elementWeakness"
  | "statusEffects"
  | "kinsectExtracts";

export type Monster = MonsterInfo &
  MonsterWeakness &
  StatusEffects &
  KinsectExtracts;

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
type Weakness = Record<AttackType, number>;

type StatusEffects = {
  statusEffects: Record<MonsterStatusEffect, number>;
};

type MonsterStatusEffect =
  | typeof MONSTER_ELEMENTAL_BLIGHTS[number]
  | typeof MONSTER_ABNORMAL_STATUSES[number];

type KinsectExtracts = {
  kinsectExtracts: Record<KinsectExtract, string[]>;
};

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
