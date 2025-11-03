use crate::models::{
    Player, Potion, Recipe,
};

#[starknet::interface]
pub trait ISellSystem<T> {
    fn sell_potion(ref self: T, potion_id: felt252);
}

#[dojo::contract]
pub mod sell_system {
    use super::{ISellSystem, Player, Potion, Recipe};
    use dojo::model::ModelStorage;

    #[abi(embed_v0)]
    impl SellImpl of ISellSystem<ContractState> {
        fn sell_potion(ref self: ContractState, potion_id: felt252) {
            let caller = starknet::get_caller_address();
            let mut world = self.world_default();

            // --- 1️⃣ Load potion owned by player ---
            let potion: Potion = world.read_model((caller, potion_id));
            if potion.owner != caller {
                panic!("Potion not owned by caller");
            }

            // --- 2️⃣ Load player ---
            let mut player: Player = world.read_model(caller);

            // --- 3️⃣ Load recipe to get base value ---
            let recipe: Recipe = world.read_model(potion.recipe_id);

            // --- 4️⃣ Compute sale value based on potion quality ---
            let base_value: u128 = recipe.base_value;
            let quality: u128 = potion.quality.into();
            let sale_value: u128 = base_value * quality / 10; // quality scales price

            // --- 5️⃣ Update player's gold balance ---
            player.gold += sale_value;
            world.write_model(@player);

            let potion: Potion = world.read_model((caller, potion_id));

            // --- 6️⃣ Delete sold potion record ---
            world.erase_model(@potion);

            // Optional: Add logs for debugging
            // dojo::print!("Potion sold successfully");
        }
    }

    // ------------------------------
    // Internal world reference helper
    // ------------------------------
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc") // replace "wc" with your namespace if different
        }
    }
}
