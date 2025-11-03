# Admin System Documentation

The Admin System (`admin_system.cairo`) provides game manager/admin functions to create and manage game models that control gameplay content.

## 📋 Available Functions

### 1. Combat Entities

#### `create_combat_entity`
Creates a combat entity (creature, boss, or player entity).

**Parameters:**
- `entity_id: felt252` - Unique identifier for the entity
- `entity_type: CombatEntityType` - Type: Player, Creature, or Boss
- `health: u16` - Initial health points
- `attack: u16` - Attack power
- `defense: u16` - Defense rating
- `alive: bool` - Automatically set to `true`

**Example:**
```cairo
admin_system.create_combat_entity(
    entity_id: 0x123,
    entity_type: CombatEntityType::Creature,
    health: 100,
    attack: 15,
    defense: 10
);
```

### 2. Creature Loot

#### `create_creature_loot`
Defines loot drops for defeated creatures.

**Parameters:**
- `creature_id: felt252` - ID of the creature
- `reward_gold: u32` - Gold reward amount
- `reward_item: IngredientType` - Item type dropped
- `quantity: u16` - Quantity of item dropped

**Example:**
```cairo
admin_system.create_creature_loot(
    creature_id: 0x123,
    reward_gold: 50,
    reward_item: IngredientType::BatWing,
    quantity: 2
);
```

### 3. Craft Recipes (Advanced Crafting)

#### `create_craft_recipe`
Creates a new crafting recipe (Potion, Charm, or Tool).

**Parameters:**
- `recipe_id: felt252` - Unique recipe identifier
- `result_type: CraftResultType` - Potion, Charm, or Tool
- `difficulty: u8` - Difficulty level (affects success chance)
- `base_value: u32` - Base value of the crafted item

**Example:**
```cairo
admin_system.create_craft_recipe(
    recipe_id: 0x777,
    result_type: CraftResultType::Potion,
    difficulty: 5,
    base_value: 100
);
```

#### `add_craft_ingredient`
Adds an ingredient requirement to a craft recipe.

**Parameters:**
- `recipe_id: felt252` - Recipe ID
- `ingredient_type: IngredientType` - Required ingredient
- `quantity: u16` - Required quantity

**Example:**
```cairo
admin_system.add_craft_ingredient(
    recipe_id: 0x777,
    ingredient_type: IngredientType::MandrakeRoot,
    quantity: 2
);
```

### 4. Zones

#### `create_zone`
Creates a new explorable zone/area.

**Parameters:**
- `zone_id: u32` - Unique zone identifier
- `zone_type: ZoneType` - Forest, Swamp, Graveyard, etc.
- `danger_level: u8` - Danger level (1-10)
- `node_spawn_rate: u16` - Ingredient node spawn rate

**Example:**
```cairo
admin_system.create_zone(
    zone_id: 1,
    zone_type: ZoneType::Forest,
    danger_level: 3,
    node_spawn_rate: 50
);
```

### 5. Potion Recipes (Brewing System)

#### `create_potion_recipe`
Creates a potion recipe for the brewing system.

**Parameters:**
- `recipe_id: felt252` - Unique recipe identifier
- `name: felt252` - Recipe name (as felt252)
- `effect: PotionEffect` - Effect type (Healing, Rage, etc.)
- `difficulty: u8` - Brewing difficulty
- `base_time: u64` - Base brewing time (blocks)
- `base_value: u128` - Base potion value

**Example:**
```cairo
admin_system.create_potion_recipe(
    recipe_id: 0x100,
    name: string_to_felt252("Healing Potion"),
    effect: PotionEffect::Healing,
    difficulty: 3,
    base_time: 100,
    base_value: 50
);
```

#### `add_recipe_ingredient`
Adds an ingredient requirement to a potion recipe.

**Parameters:**
- `recipe_id: felt252` - Recipe ID
- `ingredient_type: IngredientType` - Required ingredient
- `quantity: u8` - Required quantity

**Example:**
```cairo
admin_system.add_recipe_ingredient(
    recipe_id: 0x100,
    ingredient_type: IngredientType::MandrakeRoot,
    quantity: 1
);
```

### 6. Customers

#### `create_customer`
Creates an NPC customer for orders/sales.

**Parameters:**
- `customer_id: felt252` - Unique customer identifier
- `faction: Faction` - Customer's faction (Demon, Zombie, etc.)
- `reputation_req: i32` - Minimum reputation required
- `preferred_recipe: felt252` - Preferred recipe ID

**Example:**
```cairo
admin_system.create_customer(
    customer_id: 0x500,
    faction: Faction::Demon,
    reputation_req: 10,
    preferred_recipe: 0x100
);
```

## 🎮 Frontend Usage

All admin functions are available in the `useDojoHook`:

```typescript
import { useDojoHook, CombatEntityType, CraftResultType, IngredientType, Faction } from '../hooks/useDojo.ts';

const {
  createCombatEntity,
  createCreatureLoot,
  createCraftRecipe,
  addCraftIngredient,
  createZone,
  createPotionRecipe,
  addRecipeIngredient,
  createCustomer,
} = useDojoHook();

// Create a combat entity
await createCombatEntity(
  "0x123", // entity ID
  CombatEntityType.Creature,
  100, // health
  15,  // attack
  10   // defense
);

// Create a zone
await createZone(
  1,   // zone ID
  0,   // zone type (Forest = 0)
  3,   // danger level
  50   // node spawn rate
);
```

## 📍 Admin Panel UI

An `AdminPanel.tsx` component is available in `client/src/components/AdminPanel.tsx` that provides a UI for all admin functions. It's integrated into `App.jsx` and visible on the game page.

## ⚙️ Configuration

The admin system is:
- ✅ Added to `lib.cairo` exports
- ✅ Added to `dojo_dev.toml` writers
- ✅ Added to `dojo_sepolia.toml` writers
- ✅ Added to `main.jsx` policies (for Cartridge Controller)
- ✅ Integrated into `useDojo.ts` hook
- ✅ Available in frontend via `AdminPanel` component

## 🔒 Access Control

**Note:** The admin system currently has no built-in access control. In production, you should:

1. **Add ownership checks** - Verify the caller is an authorized admin address
2. **Use Dojo's access control** - Configure writer permissions in `dojo_dev.toml`
3. **Implement role-based access** - Create an admin role model and check it

**Example access control:**
```cairo
fn create_combat_entity(...) {
    let caller = starknet::get_caller_address();
    let world = self.world_default();
    let admin: AdminRole = world.read_model(caller);
    
    if admin.is_admin != true {
        panic!("Unauthorized: Admin access required!");
    }
    // ... rest of function
}
```

## 🎯 Typical Setup Flow

1. **Create Zones** - Set up explorable areas
2. **Create Combat Entities** - Spawn creatures and bosses
3. **Create Loot Tables** - Define rewards for each creature
4. **Create Potion Recipes** - Set up brewing recipes with ingredients
5. **Create Craft Recipes** - Set up advanced crafting (charms, tools)
6. **Create Customers** - Set up NPC customers for orders

All models are stored in Dojo world storage and can be queried by players via Torii subscriptions.

