use crate::models::{
    Player,
    Cauldron,
    Recipe,
    RecipeIngredient,
    Inventory,
    IngredientItem,
    Potion,
    IngredientType,
};

#[starknet::interface]
pub trait IBrewingSystem<T> {
    fn start_brew(ref self: T, cauldron_id: felt252, recipe_id: felt252);
    fn finish_brew(ref self: T, cauldron_id: felt252);
}

#[dojo::contract]
pub mod brewing_system {
    use super::{
        IBrewingSystem,
        Player,
        Cauldron,
        Recipe,
        RecipeIngredient,
        Inventory,
        IngredientItem,
        Potion,
        IngredientType,
    };

    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use core::num::traits::{SaturatingAdd, SaturatingSub};
    use core::array::ArrayTrait; // ✅ correct import path

    pub const BASE_SUCCESS_MULTIPLIER: u8 = 10;

    #[abi(embed_v0)]
    impl BrewingSystemImpl of IBrewingSystem<ContractState> {
        fn start_brew(ref self: ContractState, cauldron_id: felt252, recipe_id: felt252) {

            dojo::println!(" Starting brew process... ");
            let mut world = self.world_default();

            let player_addr = starknet::get_caller_address();

            let mut cauldron: Cauldron = world.read_model((player_addr, cauldron_id));

            dojo::println!(" Cauldron fetched");
            let recipe: Recipe = world.read_model(recipe_id);
            dojo::println!(" Recipe fetched");
            let _player: Player = world.read_model(player_addr);
            dojo::println!(" Player fetched");
            let inventory: Inventory = world.read_model(player_addr);
            dojo::println!(" Inventory fetched");

            // --- Ownership & state checks ---
            if cauldron.owner != player_addr {
                panic!("You don't own this cauldron!");
            }
            if cauldron.busy {
                panic!("Cauldron is already brewing!");
            }

            dojo::println!(" Starting brew for recipe ID: {:?} ", recipe_id);

            // --- Check ingredient requirements ---
            let required_ingredients: Array<RecipeIngredient> = self.get_requirements(recipe_id, ref world);
            let req_len = required_ingredients.len();
            let mut missing: bool = false;

            let mut i = 0;
            loop {
                if i >= req_len {
                    break;
                }

                let req: RecipeIngredient = *required_ingredients.at(i); // ✅ dereference
                let req_ing_type: IngredientType = req.ingredient_type;
                let req_qty: u16 = req.quantity.into();

                let mut total_owned: u16 = 0;
                let mut j = 0;

                loop {
                    if j >= inventory.count {
                        break;
                    }

                    let item: IngredientItem = world.read_model((player_addr, i)); // ✅ Composite key: (owner, slot)

                    if item.owner == player_addr && item.ingredient_type == req_ing_type {
                        total_owned = total_owned.saturating_add(item.quantity.into());
                    }

                    j += 1;
                }

                if total_owned < req_qty {
                    dojo::print!("Missing required ingredient!");
                    missing = true;
                }

                i += 1;
            }

            if missing {
                panic!("Not enough ingredients to start brewing!");
            }

            // --- Consume the required ingredients ---
            let mut k = 0;
            loop {
                if k >= req_len {
                    break;
                }
                let req: RecipeIngredient = *required_ingredients.at(k);

                self.consume_ingredient(player_addr, req.ingredient_type, req.quantity, inventory.count, ref world);
                k += 1;
            }

            // --- Begin brewing ---
            let current_block = starknet::get_block_number();
            cauldron.brewing_until = current_block.into() + recipe.base_time;
            cauldron.recipe_id = recipe_id;
            cauldron.busy = true;

            world.write_model(@cauldron);
            dojo::print!("Brewing started successfully!");
        }

        fn finish_brew(ref self: ContractState, cauldron_id: felt252) {
            let mut world = self.world_default();

            let player_addr = starknet::get_caller_address();

            let mut cauldron: Cauldron = world.read_model((player_addr, cauldron_id));
            let recipe: Recipe = world.read_model(cauldron.recipe_id);
            let mut player: Player = world.read_model(player_addr);

            if cauldron.owner != player_addr {
                panic!("Not your cauldron!");
            }
            if !cauldron.busy {
                panic!("Nothing is brewing!");
            }

            let current_block = starknet::get_block_number();
            if current_block.into() < cauldron.brewing_until {
                panic!("Brewing still in progress!");
            }

            // --- Success chance calculation ---
            let success_chance: u8 = (cauldron.quality * BASE_SUCCESS_MULTIPLIER) / recipe.difficulty;
            let potion_quality: u8 = if success_chance >= 5 { 80 } else { 20 };

            if success_chance >= 5 {
                player.gold = player.gold.saturating_add(recipe.base_value);
                dojo::print!("Brew successful!");
            } else {
                dojo::print!("Brew failed!");
            }

            // --- Create potion ---
            let potion_id: felt252 = (player_addr.into() + cauldron_id).into();
            let potion = Potion {
                potion_id,
                owner: player_addr,
                recipe_id: cauldron.recipe_id,
                effect: recipe.effect,
                quality: potion_quality,
                value: recipe.base_value,
            };
            world.write_model(@potion);

            // --- Reset cauldron ---
            cauldron.busy = false;
            world.write_model(@cauldron);
            world.write_model(@player);
        }
    }

    // ------------------------------
    // Internal helper functions
    // ------------------------------

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn get_requirements(
            self: @ContractState,
            recipe_id: felt252,
            ref world: dojo::world::WorldStorage
        ) -> Array<RecipeIngredient> {
            let mut arr: Array<RecipeIngredient> = ArrayTrait::new();
            
            // let ingredients = world.query_model::<RecipeIngredient>().filter_by_key(recipe_id);

            arr
        }

        fn consume_ingredient(
            self: @ContractState,
            player_addr: ContractAddress,
            ingredient_type: IngredientType,
            quantity: u8,
            inventory_count: u16,
            ref world: dojo::world::WorldStorage
        ) {
            let mut remaining: u8 = quantity;
            let mut slot: u16 = 0;

            loop {
                if slot >= inventory_count {
                    break;
                }

                // ✅ Composite key: (owner, slot)
                let mut item: IngredientItem = world.read_model((player_addr, slot));

                if item.owner == player_addr && item.ingredient_type == ingredient_type && remaining > 0 {
                    let available = item.quantity;
                    if available > remaining.into() {
                        // Consume partial
                        item.quantity = available.saturating_sub(remaining.into());
                        remaining = 0;
                        world.write_model(@item);
                    } else {
                        // Fully consume this slot
                        let delta: u8 = available.try_into().unwrap();
                        remaining = remaining.saturating_sub(delta);
                        item.quantity = 0;
                        world.write_model(@item);
                    }
                }

                if remaining == 0 {
                    break;
                }

                slot = slot.saturating_add(1);
            }
        }


        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc")
        }
    }
}
