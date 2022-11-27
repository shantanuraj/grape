export type EntityType = "monster" | "armour";

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

export type MonsterPart = "head" | "abdomen" | "back" | "leg" | "wing" | "tail";

export type HitzoneWeakness = Record<MonsterPart, Weakness>;

export interface PhasedWeakness extends Array<Weakness> {
  [phase: number]: Weakness;
}

export interface Monster {
  name: string;
  description: string;
  hunterTips: string;
  habitats: Habitat[];
}
