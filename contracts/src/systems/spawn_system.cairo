use crate::models::{
    Player, Position, Inventory, FactionReputation, ZoneType, Faction,
};

#[starknet::interface]
pub trait ISpawnSystem<T> {
    fn spawn_player(ref self: T, name: felt252);
}

#[dojo::contract]
pub mod spawn_system {
    use super::{ISpawnSystem, Player, Position, Inventory, FactionReputation, ZoneType, Faction};
    use dojo::model::ModelStorage;

    // Constants / Game Balancing

    pub const INIT_X: u32 = 5;
    pub const INIT_Y: u32 = 5;
    pub const START_GOLD: u128 = 100;
    pub const START_HEALTH: u16 = 100;
    pub const START_STAMINA: u16 = 50;
    pub const START_REPUTATION: i32 = 0;
    pub const START_ZONE: ZoneType = ZoneType::CursedVillage;

    // Implementation

    #[abi(embed_v0)]
    impl SpawnSystemImpl of ISpawnSystem<ContractState> {
        fn spawn_player(ref self: ContractState, name: felt252) {
            let mut world = self.world_default();
            let player_addr = starknet::get_caller_address();

            println!(" Caller address from SpawnSystem: {:?}", player_addr);

            // // Prevent duplicate spawns
            // if world.has::<Player>(player_addr) {
            //     panic!("Player already exists");
            // }

            // Initialize player stats
            let mut player = Player {
                addr: player_addr,
                name,
                gold: START_GOLD,
                health: START_HEALTH,
                stamina: START_STAMINA,
                reputation: START_REPUTATION,
            };
            world.write_model(@player);

            println!(" --- Player {} spawned with address {:?} --- ", player.name, player.addr);


            // Set initial position
            let position = Position {
                owner: player_addr,
                x: INIT_X,
                y: INIT_Y,
                zone: START_ZONE,
            };
            world.write_model(@position);

            println!(" --- Player {} position set at ({}, {}) --- ", name, position.x, position.y);

            // Create inventory
            let inventory = Inventory {
                owner: player_addr,
                capacity: 20,
                count: 0,
            };
            world.write_model(@inventory);

            println!(" --- Player {} inventory created with capacity {} --- ", name, inventory.capacity);

            // Initialize faction reputations
            let demon_rep = FactionReputation { player: player_addr, faction: Faction::Demon, reputation: 0 };
            let zombie_rep = FactionReputation { player: player_addr, faction: Faction::Zombie, reputation: 0 };
            let vampire_rep = FactionReputation { player: player_addr, faction: Faction::Vampire, reputation: 0 };
            let ghost_rep = FactionReputation { player: player_addr, faction: Faction::Ghost, reputation: 0 };

            println!(" --- Initializing faction reputations for player {} --- ", name);

            world.write_model(@demon_rep);
            world.write_model(@zombie_rep);
            world.write_model(@vampire_rep);
            world.write_model(@ghost_rep);

            println!(" --- Faction reputations initialized for player {} --- ", name);

            dojo::print!("Spawned new witch at CursedVillage!");
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
