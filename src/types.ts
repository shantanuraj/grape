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

export interface PhasedWeakness extends Array<HitzoneWeakness> {
  [phase: number]: HitzoneWeakness;
}

export interface MonsterStats {
  type: string[];
  threatLv: number;
  element: string;
  status: string;
  weak?: string;
  resist: string[];
}
export interface Monster extends MonsterStats {
  name: string;
  description: string;
  image: string;
  hunterTips: string;
  habitats: Habitat[];
  weaknesses: PhasedWeakness;
}
