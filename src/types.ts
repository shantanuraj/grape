export type EntityType = "monster" | "armor";

export interface Habitat {
  name: string;
}

export type AttackType =
  | "sever"
  | "blunt"
  | "ammo"
  | "fire"
  | "water"
  | "ice"
  | "thunder"
  | "dragon";

export type Weakness = Record<AttackType, number>;

export type MonsterPart =
  | "abdomen"
  | "back"
  | "body"
  | "crest"
  | "head"
  | "leg"
  | "neck"
  | "tail"
  | "tailTip"
  | "wing";

export type HitzoneWeakness = {
  [key in MonsterPart]?: Weakness;
};

export type Phase = "Normal phase" | "Phase 1" | "Phase 2" | "Phase 3";

export type PhasedWeakness = {
  [phase in Phase]?: HitzoneWeakness;
} & { "Normal phase": HitzoneWeakness };

export interface MonsterStats {
  type: string;
  class: string;
  threatLv: number;
  element: string;
  status: string[];
  weak?: string[];
  resist: string[];
}

export type Rank = "LR" | "MR" | "HR";

export interface Material {
  materialName: string;
  nameJaZh: string[];
  emblem: string;
  target?: number;
  carve?: Record<MonsterPart, { amount: number }>;
  capture?: number;
  partBreak?: Record<MonsterPart, { amount: number }>;
  drop?: Record<string, { amount: number }>;
  palico?: number;
}

export type MaterialsByRank = {
  [key in Rank]?: Material[];
};

export interface Monster extends MonsterStats {
  name: string;
  description: string;
  image: string;
  hunterTips: string;
  habitats: Habitat[];
  weaknesses: PhasedWeakness;
  materials: MaterialsByRank;
}
