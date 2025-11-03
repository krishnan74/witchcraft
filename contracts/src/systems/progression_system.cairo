use crate::models::{
    Player, PlayerProgression,
};
use starknet::ContractAddress;

#[starknet::interface]
pub trait IProgressionSystem<T> {
    fn add_xp(ref self: T, amount: u32);
    fn get_level(ref self: T, player: ContractAddress) -> u16;
}

#[dojo::contract]
pub mod progression_system {
    use super::{
        IProgressionSystem, Player, PlayerProgression,
    };
    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use core::num::traits::{SaturatingAdd, SaturatingSub};

    // Constants / Game Balancing
    pub const BASE_XP_PER_LEVEL: u32 = 100;
    pub const XP_MULTIPLIER: u32 = 15; // Each level requires 15% more XP
    pub const LEVEL_STAMINA_BOOST: u16 = 1; // Stamina increase per level
    pub const MAX_LEVEL: u16 = 50;

    #[abi(embed_v0)]
    impl ProgressionSystemImpl of IProgressionSystem<ContractState> {
        fn add_xp(ref self: ContractState, amount: u32) {
            let mut world = self.world_default();
            let player_addr = starknet::get_caller_address();

            // Load or create progression
            let mut progression: PlayerProgression = world.read_model(player_addr);
            
            // Check if it exists (player matches)
            if progression.player != player_addr {
                progression = PlayerProgression {
                    player: player_addr,
                    level: 1,
                    xp: 0,
                    next_level_xp: BASE_XP_PER_LEVEL,
                };
            }
            let mut player: Player = world.read_model(player_addr);

            // Increase XP
            progression.xp = progression.xp.saturating_add(amount);

            // Check for level up
            while progression.xp >= progression.next_level_xp && progression.level < MAX_LEVEL {
                // Level up
                progression.xp = progression.xp.saturating_sub(progression.next_level_xp);
                progression.level += 1;

                // Calculate next level XP requirement
                // Formula: base * (1 + multiplier * (level - 1) / 100)
                let level_factor = (progression.level.into() * XP_MULTIPLIER) / 100;
                progression.next_level_xp = BASE_XP_PER_LEVEL.saturating_add(level_factor);

                // Apply level-up bonuses
                player.stamina = player.stamina.saturating_add(LEVEL_STAMINA_BOOST);
            }

            // Cap XP if at max level
            if progression.level >= MAX_LEVEL {
                progression.xp = 0;
                progression.next_level_xp = 0;
            }

            world.write_model(@progression);
            world.write_model(@player);
        }

        fn get_level(ref self: ContractState, player: ContractAddress) -> u16 {
            let world = self.world_default();

            let progression: PlayerProgression = world.read_model(player);
            
            // Check if it exists (player matches)
            if progression.player != player {
                return 1; // Default level
            }
            
            progression.level
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

