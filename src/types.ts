export type Rank = "LR" | "MR" | "HR";

export type EntityType = "monster" | "armor";

export const ELEMENTS = ["fire", "water", "ice", "thunder", "dragon"] as const;
export type Element = typeof ELEMENTS[number];

export const WEAPON_DAMAGE_TYPES = ["sever", "blunt", "ammo"] as const;
export type WeaponDamageType = typeof WEAPON_DAMAGE_TYPES[number];

export type AttackType = Element | WeaponDamageType;

export const MONSTER_ELEMENTAL_BLIGHTS = [
  "fireblight",
  "waterblight",
  "thunderblight",
  "iceblight",
] as const;
export const ELEMENTAL_BLIGHTS = [
  ...MONSTER_ELEMENTAL_BLIGHTS,
  "dragonblight",
] as const;
export type ElementalBlight = typeof ELEMENTAL_BLIGHTS[number];

export const MONSTER_ABNORMAL_STATUSES = [
  "poison",
  "paralysis",
  "sleep",
  "blast",
  "stun",
  "exhaust",
] as const;
export const ABNORMAL_STATUSES = [
  ...MONSTER_ABNORMAL_STATUSES,
  "bleed",
  "bloodblight",
  "frenzy",
  "blastblight",
  "hellfireblight",
  "defenseDown",
  "resistanceDown",
  "stench",
  "bubble",
  "webbed",
  "leeched",
] as const;
export type AbnormalStatus = typeof ABNORMAL_STATUSES[number];

export type StatusEffect = ElementalBlight | AbnormalStatus;

export type KinsectExtract = "white" | "orange" | "red";

export type Quest = {
  type: string;
  level: number;
  name: string;
  locale: string;
};
