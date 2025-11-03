use crate::models::{
    Player, Position, Zone, ZoneType
};

#[starknet::interface]
pub trait IZoneSystem<T> {
    fn enter_zone(ref self: T, zone_id: u32);
    fn explore(ref self: T);
}

#[dojo::contract]
pub mod zone_system {
    use super::{
        IZoneSystem, Player, Position, Zone, ZoneType,
    };
    use dojo::model::ModelStorage;
    use core::num::traits::SaturatingSub;

    // Constants / Game Balancing
    pub const ZONE_ENTRY_STAMINA_COST: u16 = 20;
    pub const EXPLORATION_STAMINA_COST: u16 = 15;
    pub const BASE_REPUTATION_REQUIREMENT: i32 = 0;

    #[abi(embed_v0)]
    impl ZoneSystemImpl of IZoneSystem<ContractState> {
        fn enter_zone(ref self: ContractState, zone_id: u32) {
            let mut world = self.world_default();
            let player_addr = starknet::get_caller_address();

            // Load player and position
            let mut player: Player = world.read_model(player_addr);
            let mut position: Position = world.read_model(player_addr);

            // Check stamina
            if player.stamina < ZONE_ENTRY_STAMINA_COST {
                panic!("Not enough stamina to enter zone!");
            }

            // Load zone (if it exists)
            let zone: Zone = world.read_model(zone_id);
            
            // Check if zone actually exists (zone_id matches)
            if zone.zone_id != zone_id {
                panic!("Zone does not exist!");
            }

            // Check entry requirements (reputation, etc.)
            // Simplified: just check if player has minimum reputation
            // In a full implementation, you'd check faction-specific requirements
            if player.reputation < BASE_REPUTATION_REQUIREMENT && zone.danger_level > 3 {
                panic!("Reputation too low for this dangerous zone!");
            }

            // Move player to zone
            position.zone = zone.zone_type;
            world.write_model(@position);

            // Deduct stamina cost
            player.stamina = player.stamina.saturating_sub(ZONE_ENTRY_STAMINA_COST);
            world.write_model(@player);
        }

        fn explore(ref self: ContractState) {
            let mut world = self.world_default();
            let player_addr = starknet::get_caller_address();

            // Load player and position
            let mut player: Player = world.read_model(player_addr);
            let _position: Position = world.read_model(player_addr);

            // Check stamina
            if player.stamina < EXPLORATION_STAMINA_COST {
                panic!("Not enough stamina to explore!");
            }

            // Get zone information from position
            // In a full implementation, you would load the Zone model using zone_id
            // For now, we use the zone type from position
            
            // Random event based on danger level
            // Simplified: higher danger = better rewards but more risk
            // In a full implementation, this would:
            // - Spawn creatures based on danger_level
            // - Generate forage opportunities
            // - Find treasure chests
            // - Trigger random encounters

            // Deduct stamina cost
            player.stamina = player.stamina.saturating_sub(EXPLORATION_STAMINA_COST);
            world.write_model(@player);

            // In a full implementation, you would trigger events here:
            // - Spawn combat entity
            // - Add ingredient node
            // - Grant gold/items
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

