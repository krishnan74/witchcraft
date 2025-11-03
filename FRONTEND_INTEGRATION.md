# Frontend Integration Guide

This document outlines how to use the newly integrated systems in the frontend.

## ✅ Completed Integration

All new systems have been integrated into the `useDojoHook` hook located at:
- `client/src/hooks/useDojo.ts`

## 📦 Available Systems

### 1. Combat System
```typescript
const { attack } = useDojoHook();

// Attack a target (creature, boss, or player)
await attack(targetId: string);
```

### 2. Crafting System
```typescript
const { craft } = useDojoHook();

// Craft an item using a recipe
await craft(recipeId: string);
```

### 3. Economy System
```typescript
const { listItem, buyItem, cancelListing } = useDojoHook();

// List an item for sale
await listItem(itemSlot: number, price: bigint);

// Buy an item from marketplace
await buyItem(listingId: string);

// Cancel a listing
await cancelListing(listingId: string);
```

### 4. Faction System
```typescript
const { joinFaction, increaseReputation, applyFactionBonus } = useDojoHook();
import { Faction } from '../hooks/useDojo.ts';

// Join a faction
await joinFaction(Faction.Demon); // or Faction.Zombie, Faction.Vampire, etc.

// Increase reputation with a faction
await increaseReputation(Faction.Demon, 10);

// Apply faction bonuses to player
await applyFactionBonus(playerAddress: string);
```

### 5. Progression System
```typescript
const { addXp, getLevel, playerProgression } = useDojoHook();

// Add XP (typically called internally by other systems)
await addXp(amount: number);

// Get player level (requires view/call support - placeholder for now)
const level = await getLevel(playerAddress: string);

// Access progression data
const { level, xp, next_level_xp } = playerProgression;
```

### 6. Resource Regeneration System
```typescript
const { tickRegeneration } = useDojoHook();

// Regenerate depleted nodes (typically called by admin/keeper)
await tickRegeneration();
```

### 7. Zone System
```typescript
const { enterZone, explore } = useDojoHook();

// Enter a specific zone
await enterZone(zoneId: number);

// Explore current zone (triggers random events)
await explore();
```

## 📊 Available Data

The hook provides access to game state data:

```typescript
const {
  // Existing data
  player,
  position,
  inventory,
  ingredientItems,
  cauldrons,
  potions,
  factionReputations,
  
  // New data
  playerProgression,    // PlayerProgression | null
  combatEntities,        // CombatEntity[]
  marketListings,        // MarketListing[]
  zones,                // Zone[]
} = useDojoHook();
```

## 🔧 Type Definitions

All types are exported from `useDojo.ts`:

```typescript
import {
  Faction,
  CombatEntityType,
  CraftResultType,
  Direction,
  IngredientType,
  PlayerProgression,
  CombatEntity,
  MarketListing,
  Zone,
} from '../hooks/useDojo.ts';
```

## 📝 Example Usage

See `client/src/components/NewSystemsDemo.tsx` for a complete example component demonstrating all new systems.

### Quick Example

```typescript
import { useDojoHook, Faction } from '../hooks/useDojo.ts';

function MyComponent() {
  const {
    attack,
    sellPotion,
    joinFaction,
    explore,
    playerProgression,
    isPending,
    error
  } = useDojoHook();

  const handleCombat = async () => {
    try {
      await attack('0x123...'); // target ID
      alert('Attack successful!');
    } catch (err) {
      console.error('Combat error:', err);
    }
  };

  const handleJoinFaction = async () => {
    try {
      await joinFaction(Faction.Demon);
      alert('Joined Demon faction!');
    } catch (err) {
      console.error('Faction error:', err);
    }
  };

  return (
    <div>
      {playerProgression && (
        <div>
          Level: {playerProgression.level}
          XP: {playerProgression.xp}/{playerProgression.next_level_xp}
        </div>
      )}
      <button onClick={handleCombat} disabled={isPending}>
        Attack
      </button>
      <button onClick={handleJoinFaction} disabled={isPending}>
        Join Demon Faction
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

## 🎮 Game Loop Integration

The systems are now integrated into the complete game loop:

1. **Spawn** → `spawnPlayer(name)` - Initializes progression
2. **Move** → `movePlayer(direction)` - Movement with stamina
3. **Forage** → `forage()` - Awards XP automatically
4. **Brew** → `startBrew()`, `finishBrew()` - Awards XP on completion
5. **Sell** → `sellPotion(potionId)` - Awards XP and reputation
6. **Combat** → `attack(targetId)` - Awards XP and reputation
7. **Faction** → `joinFaction()`, `increaseReputation()` - Manage allegiances
8. **Progression** → XP tracked automatically, level ups handled internally
9. **Zone** → `enterZone()`, `explore()` - Expand gameplay

## ⚠️ Notes

- All system functions handle `isPending` state automatically
- Errors are caught and exposed via the `error` state
- System tags in manifest must match: `wc-{system_name}` (e.g., `wc-combat_system`)
- The `getLevel()` function requires view/call contract support (placeholder for now)
- Resource regeneration (`tickRegeneration`) is typically admin-only

## 🔄 Next Steps

To fully integrate:

1. **Update UI Components**: Add buttons/UI for new systems in your game scenes
2. **Torii Subscriptions**: Set up real-time data updates for new models (PlayerProgression, CombatEntity, etc.)
3. **State Management**: Update your game state management to include new data structures
4. **Error Handling**: Add user-friendly error messages for each system
5. **Loading States**: Show loading indicators during transactions

## 📚 System Tags Reference

All systems use the following tags in the manifest:
- `wc-spawn_system`
- `wc-movement_system`
- `wc-forage_system`
- `wc-node_spawn_system`
- `wc-brewing_system`
- `wc-sell_system`
- `wc-combat_system` ⭐ NEW
- `wc-crafting_system` ⭐ NEW
- `wc-economy_system` ⭐ NEW
- `wc-faction_system` ⭐ NEW
- `wc-progression_system` ⭐ NEW
- `wc-resource_regeneration_system` ⭐ NEW
- `wc-zone_system` ⭐ NEW

Make sure your `manifest_dev.json` includes all these contracts with their correct tags!

