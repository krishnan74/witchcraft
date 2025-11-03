use crate::models::{Player, Position, Direction, ZoneType};

#[starknet::interface]
pub trait IMovementSystem<T> {
    fn move_player(ref self: T, direction: Direction);
}

#[dojo::contract]
pub mod movement_system {
    use super::{IMovementSystem, Player, Position, Direction, ZoneType};
    use dojo::model::ModelStorage;
    use core::num::traits::SaturatingSub;

    // Constants / Game Settings

    pub const STAMINA_COST_PER_MOVE: u16 = 5;
    pub const WORLD_MIN_X: u32 = 0;
    pub const WORLD_MAX_X: u32 = 100;
    pub const WORLD_MIN_Y: u32 = 0;
    pub const WORLD_MAX_Y: u32 = 100;

    // Implementation

    #[abi(embed_v0)]
    impl MoveSystemImpl of IMovementSystem<ContractState> {
        fn move_player(ref self: ContractState, direction: Direction) {
            let mut world = self.world_default();
            let player_addr = starknet::get_caller_address();

            // Load player and position
            let mut player: Player = world.read_model(player_addr);
            let mut position: Position = world.read_model(player_addr);

            // Check stamina
            if player.stamina < STAMINA_COST_PER_MOVE {
                panic!("Not enough stamina to move!");
            }

            // Apply direction
            match direction {
                Direction::Up => {
                    if position.y < WORLD_MAX_Y {
                        position.y += 1;
                    }
                },
                Direction::Down => {
                    if position.y > WORLD_MIN_Y {
                        position.y -= 1;
                    }
                },
                Direction::Left => {
                    if position.x > WORLD_MIN_X {
                        position.x -= 1;
                    }
                },
                Direction::Right => {
                    if position.x < WORLD_MAX_X {
                        position.x += 1;
                    }
                },
            }

            // Deduct stamina
            player.stamina = player.stamina.saturating_sub(STAMINA_COST_PER_MOVE);

            // Save updates
            world.write_model(@player);
            world.write_model(@position);

            // dojo::print!("Player moved successfully!");
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
