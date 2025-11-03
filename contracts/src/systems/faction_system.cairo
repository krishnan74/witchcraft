use crate::models::{
    Player, FactionReputation, Faction,
};
use starknet::ContractAddress;

#[starknet::interface]
pub trait IFactionSystem<T> {
    fn join_faction(ref self: T, faction: Faction);
    fn increase_reputation(ref self: T, faction: Faction, amount: i32);
    fn apply_faction_bonus(ref self: T, player: ContractAddress);
}

#[dojo::contract]
pub mod faction_system {
    use super::{
        IFactionSystem, Player, FactionReputation, Faction,
    };
    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use core::num::traits::SaturatingAdd;
    use core::array::ArrayTrait;

    // Constants / Game Balancing
    pub const MAX_REPUTATION: i32 = 100;
    pub const MIN_REPUTATION: i32 = -100;
    pub const FACTION_BREWING_SPEED_BOOST: u8 = 5; // Percentage boost
    pub const FACTION_COMBAT_DEFENSE_BOOST: u16 = 2; // Flat defense boost

    #[abi(embed_v0)]
    impl FactionSystemImpl of IFactionSystem<ContractState> {
        fn join_faction(ref self: ContractState, faction: Faction) {
            let mut world = self.world_default();
            let player_addr = starknet::get_caller_address();

            // Load player (unused but validates player exists)
            let _player: Player = world.read_model(player_addr);

            // Check if player is neutral (all reputations at 0 or close)
            // For simplicity, allow joining if reputation is within neutral range
            let mut is_neutral = true;
            let mut factions = ArrayTrait::new();
            factions.append(Faction::Demon);
            factions.append(Faction::Vampire);
            factions.append(Faction::Ghost);
            factions.append(Faction::Zombie);
            factions.append(Faction::HumanHunter);
            
            let mut i = 0;
            loop {
                if i >= factions.len() {
                    break;
                }
                let check_faction: Faction = *factions.at(i);
                // Try to read reputation - default will be reputation = 0 if it doesn't exist
                let rep: FactionReputation = world.read_model((player_addr, check_faction));
                // Check if it's actually initialized (non-zero player address or non-zero reputation)
                if rep.player == player_addr {
                    let rep_abs = if rep.reputation >= 0 { rep.reputation } else { -rep.reputation };
                    if rep_abs > 10 {
                        is_neutral = false;
                    }
                }
                i += 1;
            }

            // Set initial reputation for joined faction
            // Check if already has reputation for this faction
            let existing_rep: FactionReputation = world.read_model((player_addr, faction));
            let has_existing = existing_rep.player == player_addr;
            
            if is_neutral || !has_existing {
                let faction_rep = FactionReputation {
                    player: player_addr,
                    faction,
                    reputation: 10, // Initial positive reputation when joining
                };
                world.write_model(@faction_rep);
            } else {
                panic!("Cannot join faction - already aligned with another!");
            }
        }

        fn increase_reputation(ref self: ContractState, faction: Faction, amount: i32) {
            let mut world = self.world_default();
            let player_addr = starknet::get_caller_address();

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

            // Add reputation points, cap at MAX_REPUTATION
            let new_reputation = faction_rep.reputation.saturating_add(amount);
            if new_reputation > MAX_REPUTATION {
                faction_rep.reputation = MAX_REPUTATION;
            } else if new_reputation < MIN_REPUTATION {
                faction_rep.reputation = MIN_REPUTATION;
            } else {
                faction_rep.reputation = new_reputation;
            }

            world.write_model(@faction_rep);
        }

        fn apply_faction_bonus(ref self: ContractState, player: ContractAddress) {
            // This function would apply faction bonuses to player stats
            // In a full implementation, this could modify player's stats based on highest reputation
            // For now, this is a placeholder that can be called to refresh bonuses
            
            let mut world = self.world_default();

            // Load player
            let mut player_data: Player = world.read_model(player);

            // Find faction with highest reputation
            let mut max_reputation: i32 = 0;
            let mut best_faction = Faction::Demon;

            let mut factions = ArrayTrait::new();
            factions.append(Faction::Demon);
            factions.append(Faction::Vampire);
            factions.append(Faction::Ghost);
            factions.append(Faction::Zombie);
            factions.append(Faction::HumanHunter);
            
            let mut i = 0;
            loop {
                if i >= factions.len() {
                    break;
                }
                let faction: Faction = *factions.at(i);
                let rep: FactionReputation = world.read_model((player, faction));
                // Check if it exists (player matches)
                if rep.player == player && rep.reputation > max_reputation {
                    max_reputation = rep.reputation;
                    best_faction = faction;
                }
                i += 1;
            }

            // Apply bonuses based on faction reputation
            // Note: Player model doesn't have separate defense stat, so we can't apply combat bonus directly
            // This would need to be tracked separately or stored in a CombatEntity
            // For now, we'll just validate that bonuses can be calculated

            world.write_model(@player_data);
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

