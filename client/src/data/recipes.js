/**
 * Recipe data aligned with Dojo models
 * 7 recipes for 7 days - one potion per day
 */

// Map ingredient types to display names and emojis
export const INGREDIENT_DISPLAY = {
  MandrakeRoot: { name: 'Mandrake Root', emoji: '🌱', zone: 'Forest' },
  GraveDust: { name: 'Grave Dust', emoji: '⚰️', zone: 'Graveyard' },
  BatWing: { name: 'Bat Wing', emoji: '🦇', zone: 'CursedVillage' },
  GhostMushroom: { name: 'Ghost Mushroom', emoji: '🍄', zone: 'Swamp' },
  WyrmScale: { name: 'Wyrm Scale', emoji: '🐉', zone: 'MountainPass' },
  VampireBloom: { name: 'Vampire Bloom', emoji: '🌹', zone: 'Ruins' },
  PumpkinSeed: { name: 'Pumpkin Seed', emoji: '🎃', zone: 'CursedVillage' }
}

// Map potion effects to display names and emojis
export const POTION_EFFECT_DISPLAY = {
  Healing: { name: 'Healing Potion', emoji: '💚' },
  Rage: { name: 'Rage Potion', emoji: '🔥' },
  Invisibility: { name: 'Invisibility Potion', emoji: '👻' },
  FearAura: { name: 'Fear Aura Potion', emoji: '😱' },
  Speed: { name: 'Speed Potion', emoji: '⚡' },
  FireResistance: { name: 'Fire Resistance Potion', emoji: '🛡️' },
  Transformation: { name: 'Transformation Potion', emoji: '🔄' },
  Curse: { name: 'Curse Potion', emoji: '💀' }
}

/**
 * Recipe definitions for 7 days
 * Each recipe follows the Dojo Recipe and RecipeIngredient model structure
 */
export const RECIPES = [
  {
    // Day 1
    recipe_id: 'recipe_day_1',
    name: 'Healing Elixir',
    effect: 'Healing',
    difficulty: 1,
    base_time: 20, // seconds
    base_value: 50,
    ingredients: [
      { ingredient_type: 'MandrakeRoot', quantity: 2 },
      { ingredient_type: 'GhostMushroom', quantity: 1 }
    ]
  },
  {
    // Day 2
    recipe_id: 'recipe_day_2',
    name: 'Berserker\'s Brew',
    effect: 'Rage',
    difficulty: 2,
    base_time: 20,
    base_value: 75,
    ingredients: [
      { ingredient_type: 'WyrmScale', quantity: 1 },
      { ingredient_type: 'BatWing', quantity: 2 }
    ]
  },
  {
    // Day 3
    recipe_id: 'recipe_day_3',
    name: 'Shadow Blend',
    effect: 'Invisibility',
    difficulty: 2,
    base_time: 20,
    base_value: 100,
    ingredients: [
      { ingredient_type: 'VampireBloom', quantity: 1 },
      { ingredient_type: 'GraveDust', quantity: 2 }
    ]
  },
  {
    // Day 4
    recipe_id: 'recipe_day_4',
    name: 'Terror Tonic',
    effect: 'FearAura',
    difficulty: 3,
    base_time: 20,
    base_value: 125,
    ingredients: [
      { ingredient_type: 'GraveDust', quantity: 3 },
      { ingredient_type: 'PumpkinSeed', quantity: 1 }
    ]
  },
  {
    // Day 5
    recipe_id: 'recipe_day_5',
    name: 'Swiftness Serum',
    effect: 'Speed',
    difficulty: 3,
    base_time: 20,
    base_value: 150,
    ingredients: [
      { ingredient_type: 'MandrakeRoot', quantity: 1 },
      { ingredient_type: 'GhostMushroom', quantity: 2 },
      { ingredient_type: 'WyrmScale', quantity: 1 }
    ]
  },
  {
    // Day 6
    recipe_id: 'recipe_day_6',
    name: 'Flame Ward Potion',
    effect: 'FireResistance',
    difficulty: 4,
    base_time: 20,
    base_value: 175,
    ingredients: [
      { ingredient_type: 'WyrmScale', quantity: 2 },
      { ingredient_type: 'VampireBloom', quantity: 1 },
      { ingredient_type: 'BatWing', quantity: 1 }
    ]
  },
  {
    // Day 7
    recipe_id: 'recipe_day_7',
    name: 'Cursed Transformation',
    effect: 'Transformation',
    difficulty: 5,
    base_time: 20,
    base_value: 200,
    ingredients: [
      { ingredient_type: 'MandrakeRoot', quantity: 1 },
      { ingredient_type: 'GraveDust', quantity: 1 },
      { ingredient_type: 'VampireBloom', quantity: 1 },
      { ingredient_type: 'PumpkinSeed', quantity: 2 }
    ]
  }
]

/**
 * Get recipe for a specific day (1-7)
 */
export function getRecipeForDay(day) {
  const dayIndex = ((day - 1) % 7)
  return RECIPES[dayIndex]
}

/**
 * Get all zones/biomes from Dojo ZoneType enum
 */
export const ZONES = [
  'Forest',
  'Swamp',
  'Graveyard',
  'CursedVillage',
  'Ruins',
  'MountainPass'
]

/**
 * Map ingredients to their spawn zones
 */
export const INGREDIENT_ZONE_MAP = {
  MandrakeRoot: 'Forest',
  GhostMushroom: 'Swamp',
  GraveDust: 'Graveyard',
  PumpkinSeed: 'CursedVillage',
  BatWing: 'CursedVillage',
  VampireBloom: 'Ruins',
  WyrmScale: 'MountainPass'
}

