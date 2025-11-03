use crate::models::{
    Player, Potion, Recipe, Customer, Order, FactionReputation, Faction, PlayerProgression,
};

#[starknet::interface]
pub trait ISellSystem<T> {
    fn sell_potion(ref self: T, potion_id: felt252);
}

#[dojo::contract]
pub mod sell_system {
    use super::{ISellSystem, Player, Potion, Recipe, Customer, Order, FactionReputation, Faction, PlayerProgression};
    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use core::num::traits::{SaturatingAdd, SaturatingSub};

    pub const SELL_XP_REWARD: u32 = 10;
    pub const SELL_REPUTATION_BOOST: i32 = 1;

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
            player.gold = player.gold.saturating_add(sale_value);
            world.write_model(@player);

            // --- 6️⃣ Increase faction reputation if potion matches customer preference ---
            // In a full implementation, you would check Customer orders/preferences
            // For now, we'll increase reputation with a default faction (e.g., Demon)
            self.adjust_reputation(caller, Faction::Demon, SELL_REPUTATION_BOOST, ref world);

            // --- 7️⃣ Award XP for selling ---
            self.award_xp(caller, SELL_XP_REWARD, ref world);

            let potion: Potion = world.read_model((caller, potion_id));

            // --- 8️⃣ Delete sold potion record ---
            world.erase_model(@potion);

            // Optional: Add logs for debugging
            // dojo::print!("Potion sold successfully");
        }
    }

    // ------------------------------
    // Internal helper functions
    // ------------------------------

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn adjust_reputation(
            self: @ContractState,
            player_addr: ContractAddress,
            faction: Faction,
            delta: i32,
            ref world: dojo::world::WorldStorage,
        ) {
            // Load or create faction reputation
            let mut faction_rep: FactionReputation = world.read_model((player_addr, faction));
            
            // Check if it exists (player matches)
            if faction_rep.player != player_addr {
                faction_rep = FactionReputation {
                    player: player_addr,
                    faction,
                    reputation: 0,
                };
            }

            // Add reputation points, cap at ±100
            let new_reputation = faction_rep.reputation.saturating_add(delta);
            if new_reputation > 100 {
                faction_rep.reputation = 100;
            } else if new_reputation < -100 {
                faction_rep.reputation = -100;
            } else {
                faction_rep.reputation = new_reputation;
            }

            world.write_model(@faction_rep);
        }

        fn award_xp(
            self: @ContractState,
            player_addr: ContractAddress,
            amount: u32,
            ref world: dojo::world::WorldStorage,
        ) {
            // Load or create progression
            let mut progression: PlayerProgression = world.read_model(player_addr);
            
            // Check if it exists (player matches)
            if progression.player != player_addr {
                progression = PlayerProgression {
                    player: player_addr,
                    level: 1,
                    xp: 0,
                    next_level_xp: 100,
                };
            }

            // Increase XP
            progression.xp = progression.xp.saturating_add(amount);

            // Check for level up (simplified - full logic in progression_system)
            if progression.xp >= progression.next_level_xp && progression.level < 50 {
                progression.xp = progression.xp.saturating_sub(progression.next_level_xp);
                progression.level += 1;
                // Calculate next level XP requirement
                let level_factor = (progression.level.into() * 15) / 100;
                progression.next_level_xp = 100.saturating_add(level_factor);
            }

            world.write_model(@progression);
        }

        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc")
        }
    }
}
