use starknet::ContractAddress;
use core::num::traits::{SaturatingAdd, SaturatingSub};

#[derive(Serde, Copy, Drop, Default, Introspect)]
pub enum Direction {
    // Serialized as 0.
    #[default]
    Left,
    // Serialized as 1.
    Right,
    // Serialized as 2.
    Up,
    // Serialized as 3.
    Down,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Position {
    #[key]
    pub player: ContractAddress,
    pub x: u32,
    pub y: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Moves {
    #[key]
    pub player: ContractAddress,
    pub remaining: u8,
}

#[generate_trait]
pub impl PositionImpl of PositionTrait {
    fn apply_direction(ref self: Position, direction: Direction) {
        match direction {
            Direction::Left => { self.x = self.x.saturating_sub(1) },
            Direction::Right => { self.x = self.x.saturating_add(1) },
            Direction::Up => { self.y = self.y.saturating_add(1) },
            Direction::Down => { self.y = self.y.saturating_sub(1) },
        }
    }
}