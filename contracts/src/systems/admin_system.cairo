use crate::models::{
    CombatEntity, CombatEntityType, CreatureLoot, IngredientType,
    CraftRecipe, CraftResultType, CraftIngredient,
    Zone, ZoneType,
    Recipe, RecipeIngredient, PotionEffect,
    Customer, Faction,
};

#[starknet::interface]
pub trait IAdminSystem<T> {
    // Combat entities
    fn create_combat_entity(ref self: T, entity_type: CombatEntityType, health: u16, attack: u16, defense: u16) -> felt252;
    fn create_creature_loot(ref self: T, creature_id: felt252, reward_gold: u32, reward_item: IngredientType, quantity: u16);
    
    // Crafting recipes
    fn create_craft_recipe(ref self: T, result_type: CraftResultType, difficulty: u8, base_value: u32) -> felt252;
    fn add_craft_ingredient(ref self: T, recipe_id: felt252, ingredient_type: IngredientType, quantity: u16);
    
    // Zones
    fn create_zone(ref self: T, zone_id: u32, zone_type: ZoneType, danger_level: u8, node_spawn_rate: u16);
    
    // Potion recipes (for brewing system)
    fn create_potion_recipe(ref self: T, name: felt252, effect: PotionEffect, difficulty: u8, base_time: u64, base_value: u128) -> felt252;
    fn add_recipe_ingredient(ref self: T, recipe_id: felt252, ingredient_type: IngredientType, quantity: u8);
    
    // Customers (for orders/economy)
    fn create_customer(ref self: T, faction: Faction, reputation_req: i32, preferred_recipe: felt252) -> felt252;
}

#[dojo::contract]
pub mod admin_system {
    use super::{
        IAdminSystem, CombatEntity, CombatEntityType, CreatureLoot, IngredientType,
        CraftRecipe, CraftResultType, CraftIngredient,
        Zone, ZoneType,
        Recipe, RecipeIngredient, PotionEffect,
        Customer, Faction,
    };
    use dojo::model::ModelStorage;

    #[abi(embed_v0)]
    impl AdminSystemImpl of IAdminSystem<ContractState> {
        fn create_combat_entity(
            ref self: ContractState,
            entity_type: CombatEntityType,
            health: u16,
            attack: u16,
            defense: u16,
        ) -> felt252 {
            let mut world = self.world_default();

            // Generate unique ID using caller address, block number, and timestamp
            let caller = starknet::get_caller_address();
            let block_num = starknet::get_block_number();
            let timestamp = starknet::get_block_timestamp();
            
            // Combine to create unique ID: caller + block + timestamp
            let caller_felt: felt252 = caller.into();
            let block_felt: felt252 = block_num.into();
            let timestamp_felt: felt252 = timestamp.into();
            let mut entity_id: felt252 = (caller_felt * 1000000000000000000000000) + (block_felt * 10000000000000000) + timestamp_felt;

            // Check if entity already exists (retry if collision)
            let mut existing: CombatEntity = world.read_model(entity_id);
            let mut attempts: u8 = 0;
            while existing.id == entity_id && existing.id != 0 && attempts < 10 {
                // If collision, add a small increment
                entity_id = entity_id + (attempts + 1).into();
                existing = world.read_model(entity_id);
                attempts += 1;
            }
            
            // Final check after retry
            existing = world.read_model(entity_id);
            if existing.id == entity_id && existing.id != 0 {
                panic!("Failed to generate unique entity ID after retries!");
            }

            let entity = CombatEntity {
                id: entity_id,
                entity_type,
                health,
                attack,
                defense,
                alive: true,
            };

            world.write_model(@entity);
            
            entity_id
        }

        fn create_creature_loot(
            ref self: ContractState,
            creature_id: felt252,
            reward_gold: u32,
            reward_item: IngredientType,
            quantity: u16,
        ) {
            let mut world = self.world_default();

            // Check if loot already exists for this creature
            let existing: CreatureLoot = world.read_model(creature_id);
            if existing.creature_id == creature_id && existing.creature_id != 0 {
                panic!("Loot for this creature already exists!");
            }

            let loot = CreatureLoot {
                creature_id,
                reward_gold,
                reward_item,
                quantity,
            };

            world.write_model(@loot);
        }

        fn create_craft_recipe(
            ref self: ContractState,
            result_type: CraftResultType,
            difficulty: u8,
            base_value: u32,
        ) -> felt252 {
            let mut world = self.world_default();

            // Generate unique ID
            let caller = starknet::get_caller_address();
            let block_num = starknet::get_block_number();
            let timestamp = starknet::get_block_timestamp();
            let caller_felt: felt252 = caller.into();
            let block_felt: felt252 = block_num.into();
            let timestamp_felt: felt252 = timestamp.into();
            let mut recipe_id: felt252 = (caller_felt * 1000000000000000000000000) + (block_felt * 10000000000000000) + timestamp_felt;

            // Check if recipe already exists
            let mut existing: CraftRecipe = world.read_model(recipe_id);
            let mut attempts: u8 = 0;
            while existing.recipe_id == recipe_id && existing.recipe_id != 0 && attempts < 10 {
                recipe_id = recipe_id + (attempts + 1).into();
                existing = world.read_model(recipe_id);
                attempts += 1;
            }
            
            existing = world.read_model(recipe_id);
            if existing.recipe_id == recipe_id && existing.recipe_id != 0 {
                panic!("Failed to generate unique recipe ID after retries!");
            }

            let recipe = CraftRecipe {
                recipe_id,
                result_type,
                difficulty,
                base_value,
            };

            world.write_model(@recipe);
            
            recipe_id
        }

        fn add_craft_ingredient(
            ref self: ContractState,
            recipe_id: felt252,
            ingredient_type: IngredientType,
            quantity: u16,
        ) {
            let mut world = self.world_default();

            // Verify recipe exists first
            let recipe: CraftRecipe = world.read_model(recipe_id);
            if recipe.recipe_id != recipe_id {
                panic!("Craft recipe does not exist!");
            }

            // Create ingredient requirement
            let ingredient = CraftIngredient {
                recipe_id,
                ingredient_type,
                quantity,
            };

            world.write_model(@ingredient);
        }

        fn create_zone(
            ref self: ContractState,
            zone_id: u32,
            zone_type: ZoneType,
            danger_level: u8,
            node_spawn_rate: u16,
        ) {
            let mut world = self.world_default();

            // Check if zone already exists
            let existing: Zone = world.read_model(zone_id);
            if existing.zone_id == zone_id && existing.zone_id != 0 {
                panic!("Zone with this ID already exists!");
            }

            let zone = Zone {
                zone_id,
                zone_type,
                danger_level,
                node_spawn_rate,
            };

            world.write_model(@zone);
        }

        fn create_potion_recipe(
            ref self: ContractState,
            name: felt252,
            effect: PotionEffect,
            difficulty: u8,
            base_time: u64,
            base_value: u128,
        ) -> felt252 {
            let mut world = self.world_default();

            // Generate unique ID
            let caller = starknet::get_caller_address();
            let block_num = starknet::get_block_number();
            let timestamp = starknet::get_block_timestamp();
            let caller_felt: felt252 = caller.into();
            let block_felt: felt252 = block_num.into();
            let timestamp_felt: felt252 = timestamp.into();
            let mut recipe_id: felt252 = (caller_felt * 1000000000000000000000000) + (block_felt * 10000000000000000) + timestamp_felt;

            // Check if recipe already exists
            let mut existing: Recipe = world.read_model(recipe_id);
            let mut attempts: u8 = 0;
            while existing.recipe_id == recipe_id && existing.recipe_id != 0 && attempts < 10 {
                recipe_id = recipe_id + (attempts + 1).into();
                existing = world.read_model(recipe_id);
                attempts += 1;
            }
            
            existing = world.read_model(recipe_id);
            if existing.recipe_id == recipe_id && existing.recipe_id != 0 {
                panic!("Failed to generate unique potion recipe ID after retries!");
            }

            let recipe = Recipe {
                recipe_id,
                name,
                effect,
                difficulty,
                base_time,
                base_value,
            };

            world.write_model(@recipe);
            
            recipe_id
        }

        fn add_recipe_ingredient(
            ref self: ContractState,
            recipe_id: felt252,
            ingredient_type: IngredientType,
            quantity: u8,
        ) {
            let mut world = self.world_default();

            // Verify recipe exists first
            let recipe: Recipe = world.read_model(recipe_id);
            if recipe.recipe_id != recipe_id {
                panic!("Potion recipe does not exist!");
            }

            // Create ingredient requirement
            let ingredient = RecipeIngredient {
                recipe_id,
                ingredient_type,
                quantity,
            };

            world.write_model(@ingredient);
        }

        fn create_customer(
            ref self: ContractState,
            faction: Faction,
            reputation_req: i32,
            preferred_recipe: felt252,
        ) -> felt252 {
            let mut world = self.world_default();

            // Generate unique ID
            let caller = starknet::get_caller_address();
            let block_num = starknet::get_block_number();
            let timestamp = starknet::get_block_timestamp();
            let caller_felt: felt252 = caller.into();
            let block_felt: felt252 = block_num.into();
            let timestamp_felt: felt252 = timestamp.into();
            let mut customer_id: felt252 = (caller_felt * 1000000000000000000000000) + (block_felt * 10000000000000000) + timestamp_felt;

            // Check if customer already exists
            let mut existing: Customer = world.read_model(customer_id);
            let mut attempts: u8 = 0;
            while existing.id == customer_id && existing.id != 0 && attempts < 10 {
                customer_id = customer_id + (attempts + 1).into();
                existing = world.read_model(customer_id);
                attempts += 1;
            }
            
            existing = world.read_model(customer_id);
            if existing.id == customer_id && existing.id != 0 {
                panic!("Failed to generate unique customer ID after retries!");
            }

            let customer = Customer {
                id: customer_id,
                faction,
                reputation_req,
                preferred_recipe,
            };

            world.write_model(@customer);
            
            customer_id
        }
    }

    // ------------------------------
    // Internal world reference helper
    // ------------------------------

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc")
        }
    }
}

