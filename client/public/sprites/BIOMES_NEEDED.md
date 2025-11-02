# Biome Images Required

Based on the Dojo `ZoneType` enum, you need to provide **6 biome background images** for the game world.

## Required Biome Images

Each biome represents a different area where specific ingredients spawn. Players will explore these biomes during the day to collect ingredients.

### 1. **Forest** 🌲
- **File name:** `forest.png` or `forest_bg.png`
- **Location:** `/sprites/forest.png`
- **Description:** Green forest area with trees
- **Ingredients found here:**
  - Mandrake Root 🌱

### 2. **Swamp** 🐸
- **File name:** `swamp.png` or `swamp_bg.png`
- **Location:** `/sprites/swamp.png`
- **Description:** Dark, murky swamp area
- **Ingredients found here:**
  - Ghost Mushroom 🍄

### 3. **Graveyard** ⚰️
- **File name:** `graveyard.png` or `graveyard_bg.png`
- **Location:** `/sprites/graveyard.png`
- **Description:** Spooky graveyard with tombstones
- **Ingredients found here:**
  - Grave Dust ⚰️

### 4. **Cursed Village** 🏚️
- **File name:** `cursed_village.png` or `village_bg.png`
- **Location:** `/sprites/cursed_village.png`
- **Description:** Abandoned, cursed village
- **Ingredients found here:**
  - Bat Wing 🦇
  - Pumpkin Seed 🎃

### 5. **Ruins** 🏛️
- **File name:** `ruins.png` or `ruins_bg.png`
- **Location:** `/sprites/ruins.png`
- **Description:** Ancient ruins/temple area
- **Ingredients found here:**
  - Vampire Bloom 🌹

### 6. **Mountain Pass** ⛰️
- **File name:** `mountain_pass.png` or `mountain_bg.png`
- **Location:** `/sprites/mountain_pass.png`
- **Description:** Rocky mountain pass area
- **Ingredients found here:**
  - Wyrm Scale 🐉

## Image Specifications

- **Recommended resolution:** 1280x720 (same as canvas size) or larger for seamless tiling
- **Format:** PNG (with transparency support if needed)
- **Style:** Match the game's dark, mystical theme
- **Purpose:** These will be used as background tiles/areas in the exploration scene

## Ingredient Spawn Locations

When ingredients are spawned, they will appear as collectible items on top of these biome backgrounds. Each ingredient type is tied to its specific biome according to the Dojo model structure.

## Biome Coordinates Reference

All biomes are placed in a 3x2 grid covering the entire 1920x1080 map:

| Biome | Zone Type | Coordinates | Size | Image Path |
|-------|-----------|-------------|------|------------|
| Forest | Forest | (0, 0) | 640x540 | `/sprites/forest.png` |
| Graveyard | Graveyard | (640, 0) | 640x540 | `/sprites/graveyard.png` |
| Cursed Village | CursedVillage | (1280, 0) | 640x540 | `/sprites/cursed_village.png` |
| Swamp | Swamp | (0, 540) | 640x540 | `/sprites/swamp.png` |
| Ruins | Ruins | (640, 540) | 640x540 | `/sprites/ruins.png` |
| Mountain Pass | MountainPass | (1280, 540) | 640x540 | `/sprites/mountain_pass.png` |

### Layout Grid:
```
[Forest]      [Graveyard]      [Cursed Village]
(0, 0)        (640, 0)         (1280, 0)
640x540       640x540          640x540

[Swamp]       [Ruins]          [Mountain Pass]
(0, 540)      (640, 540)       (1280, 540)
640x540       640x540          640x540
```

---

**Current Status:** ✅ All biome images have been placed on the map. Biome name popups appear when the player is nearby.
**Next Step:** Implement random ingredient spawning within each biome based on the current day's recipe requirements.

