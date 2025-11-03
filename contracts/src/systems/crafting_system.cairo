use crate::models::{
    Player, CraftRecipe, CraftIngredient, IngredientType, Inventory, IngredientItem,
    FactionReputation, Faction, CraftResultType
};

#[starknet::interface]
pub trait ICraftingSystem<T> {
    fn craft(ref self: T, recipe_id: felt252);
}

#[dojo::contract]
pub mod crafting_system {
    use super::{
        ICraftingSystem, Player, CraftRecipe, CraftResultType, CraftIngredient, IngredientType,
        Inventory, IngredientItem, FactionReputation, Faction,
    };
    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use core::num::traits::{SaturatingSub, SaturatingAdd};
    use core::array::ArrayTrait;

    // Constants / Game Balancing
    pub const BASE_SUCCESS_CHANCE: u8 = 60;
    pub const REPUTATION_SUCCESS_BOOST: u8 = 5;
    pub const PARTIAL_XP_ON_FAILURE: u32 = 10;

    #[abi(embed_v0)]
    impl CraftingSystemImpl of ICraftingSystem<ContractState> {
        fn craft(ref self: ContractState, recipe_id: felt252) {
            let mut world = self.world_default();
            let player_addr = starknet::get_caller_address();

            // Load recipe
            let recipe: CraftRecipe = world.read_model(recipe_id);
            let mut player: Player = world.read_model(player_addr);
            let inventory: Inventory = world.read_model(player_addr);

            // Get required ingredients
            let required_ingredients = self.get_recipe_ingredients(recipe_id, ref world);
            let req_len = required_ingredients.len();

            // Check if player has all required ingredients
            let mut i = 0;
            loop {
                if i >= req_len {
                    break;
                }

                let req: CraftIngredient = *required_ingredients.at(i);
                let req_ing_type: IngredientType = req.ingredient_type;
                let req_qty: u16 = req.quantity;

                let total_owned = self.count_ingredient(player_addr, req_ing_type, inventory.count, ref world);

                if total_owned < req_qty {
                    panic!("Missing required ingredient!");
                }

                i += 1;
            }

            // Remove items from inventory
            let mut j = 0;
            loop {
                if j >= req_len {
                    break;
                }

                let req: CraftIngredient = *required_ingredients.at(j);
                self.consume_ingredient(player_addr, req.ingredient_type, req.quantity, inventory.count, ref world);

                j += 1;
            }

            // Compute success chance based on difficulty and player reputation
            let success_chance = self.calculate_success_chance(recipe.difficulty, player_addr, ref world);

            // On success: create crafted item (simplified - just grant gold/value for now)
            // On failure: lose materials and apply partial XP reward
            if success_chance >= 50 {
                // Success: grant base value
                player.gold = player.gold.saturating_add(recipe.base_value.into());
                world.write_model(@player);
                // In a full implementation, you would create a Potion, Charm, or Tool here
            } else {
                // Failure: grant partial XP
                // XP system would be handled by progression_system
            }
        }
    }

    // ------------------------------
    // Internal helper functions
    // ------------------------------

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn get_recipe_ingredients(
            self: @ContractState,
            recipe_id: felt252,
            ref world: dojo::world::WorldStorage,
        ) -> Array<CraftIngredient> {
            // In a full implementation, this would query all CraftIngredient models with this recipe_id
            // For now, return empty array - ingredients should be registered separately
            let mut arr: Array<CraftIngredient> = ArrayTrait::new();
            arr
        }

        fn count_ingredient(
            self: @ContractState,
            player_addr: ContractAddress,
            ingredient_type: IngredientType,
            inventory_count: u16,
            ref world: dojo::world::WorldStorage,
        ) -> u16 {
            let mut total: u16 = 0;
            let mut slot: u16 = 0;

            loop {
                if slot >= inventory_count {
                    break;
                }

                let item: IngredientItem = world.read_model((player_addr, slot));
                if item.owner == player_addr && item.ingredient_type == ingredient_type {
                    total = total.saturating_add(item.quantity);
                }

                slot += 1;
            }

            total
        }

        fn consume_ingredient(
            self: @ContractState,
            player_addr: ContractAddress,
            ingredient_type: IngredientType,
            quantity: u16,
            inventory_count: u16,
            ref world: dojo::world::WorldStorage,
        ) {
            let mut remaining: u16 = quantity;
            let mut slot: u16 = 0;

            loop {
                if slot >= inventory_count {
                    break;
                }

                let mut item: IngredientItem = world.read_model((player_addr, slot));

                if item.owner == player_addr && item.ingredient_type == ingredient_type && remaining > 0 {
                    let available = item.quantity;
                    if available > remaining {
                        item.quantity = available.saturating_sub(remaining);
                        remaining = 0;
                        world.write_model(@item);
                    } else {
                        remaining = remaining.saturating_sub(available);
                        item.quantity = 0;
                        world.write_model(@item);
                    }
                }

                if remaining == 0 {
                    break;
                }

                slot += 1;
            }
        }

        fn calculate_success_chance(
            self: @ContractState,
            difficulty: u8,
            player_addr: ContractAddress,
            ref world: dojo::world::WorldStorage,
        ) -> u8 {
            let base_chance = BASE_SUCCESS_CHANCE;
            
            // Get player's highest faction reputation
            let mut max_reputation: i32 = 0;
            
            // Check all faction reputations (simplified - check specific factions)
            let mut factions_to_check = ArrayTrait::new();
            factions_to_check.append(Faction::Demon);
            factions_to_check.append(Faction::Vampire);
            factions_to_check.append(Faction::Ghost);
            factions_to_check.append(Faction::Zombie);
            
            let mut i = 0;
            loop {
                if i >= factions_to_check.len() {
                    break;
                }
                let faction: Faction = *factions_to_check.at(i);
                let rep: FactionReputation = world.read_model((player_addr, faction));
                // Check if it exists (player matches)
                if rep.player == player_addr && rep.reputation > max_reputation {
                    max_reputation = rep.reputation;
                }
                i += 1;
            }

            // Reputation boost (capped)
            let rep_boost = if max_reputation > 100 { 100 } else { max_reputation };
            let rep_boost_u32: u32 = if rep_boost >= 0 { rep_boost.try_into().unwrap_or(0) } else { 0 };
            let rep_success_boost_u32: u32 = REPUTATION_SUCCESS_BOOST.into();
            let boost_val: u32 = (rep_boost_u32 / 10) * rep_success_boost_u32;
            let boost: u8 = if boost_val > 255 { 255 } else { boost_val.try_into().unwrap_or(0) };

            // Success chance = base - difficulty + reputation boost
            let mut success = base_chance.saturating_sub(difficulty);
            success = success.saturating_add(boost);

            if success > 100 {
                100
            } else {
                success
            }
        }

        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc")
        }
    }
}

