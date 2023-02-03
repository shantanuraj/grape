export type EntityType = "monster" | "armor";

export interface Habitat {
  name: string;
}

export const ELEMENTS = ["fire", "water", "ice", "thunder", "dragon"] as const;
export type Element = typeof ELEMENTS[number];

export type AttackType = "sever" | "blunt" | "ammo" | Element;

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

export const STATUS_EFFECTS = [
  "poison",
  "stun",
  "paralysis",
  "sleep",
  "blast",
  "exhaust",
  "fireblight",
  "waterblight",
  "thunderblight",
  "iceblight",
] as const;
export type StatusEffect = typeof STATUS_EFFECTS[number];

export interface MonsterStats {
  type: string;
  class: string;
  threatLv: number;
  element?: Element;
  status: StatusEffect[];
  weak?: Element[];
  resist: Element[];
}

export type KinsectExtract = "white" | "orange" | "red";

export type Kinsect = {
  [key in KinsectExtract]: string[];
};

export type Quest = {
  type: string;
  level: number;
  name: string;
  locale: string;
};

export type Rank = "LR" | "MR" | "HR";

export type MaterialChance = {
  amount?: number;
  percentage: number;
};

export interface Material {
  materialName: string;
  nameJaZh: string[];
  emblem: string;
  target?: MaterialChance;
  carve?: Record<MonsterPart, MaterialChance>;
  capture?: MaterialChance;
  partBreak?: Record<MonsterPart, MaterialChance>;
  drop?: {
    normal?: MaterialChance;
    riding?: MaterialChance;
  };
  palico?: MaterialChance;
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
  ailments: {
    [k in StatusEffect]: number;
  };
  kinsect?: Kinsect;
  breakable: string[];
  severable: string[];
  items: string[];
  quests: Quest[];
  materials: MaterialsByRank;
}
