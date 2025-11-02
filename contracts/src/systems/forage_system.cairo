use crate::models::{
    Player,
    Position,
    Inventory,
    IngredientNode,
    IngredientItem,
    IngredientType,
};

#[starknet::interface]
pub trait IForageSystem<T> {
    fn forage(ref self: T);
}

#[dojo::contract]
pub mod forage_system {
    use super::{
        IForageSystem,
        Player,
        Position,
        Inventory,
        IngredientNode,
        IngredientItem,
        IngredientType,
    };
    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use core::num::traits::SaturatingSub;

    // Game Balancing Constants
    pub const FORAGE_STAMINA_COST: u16 = 10;
    pub const NODE_RESPAWN_DURATION: u64 = 300;

    #[abi(embed_v0)]
    impl ForageSystemImpl of IForageSystem<ContractState> {
        fn forage(ref self: ContractState) {
            let mut world = self.world_default();

            let player_addr = starknet::get_caller_address();

            // --- Load player and position ---
            let mut player: Player = world.read_model(player_addr);
            let position: Position = world.read_model(player_addr);

            if player.stamina < FORAGE_STAMINA_COST {
                panic!("Too tired to forage!");
            }

            // --- Identify the node by coordinates ---
            let node_id: felt252 = (position.x * 1000 + position.y).into();
            let mut node: IngredientNode = world.read_model(node_id);

            // --- Check if node is active and not depleted ---
            if !node.active {
                panic!("No ingredient node found at this location!");
            }

            if node.quantity == 0 {
                panic!("This node is already depleted!");
            }

            // --- Check respawn / cooldown ---
            let current_block = starknet::get_block_number();
            if node.respawn_epoch > current_block.into() {
                panic!("This ingredient hasn't regrown yet!");
            }

            // --- Load and check inventory ---
            let mut inventory: Inventory = world.read_model(player_addr);
            if inventory.count >= inventory.capacity {
                panic!("Inventory full!");
            }

            // --- Forage logic ---
            let item = IngredientItem {
                slot: inventory.count,
                owner: player_addr,
                ingredient_type: node.ingredient_type,
                quantity: 1,
            };
            world.write_model(@item);

            inventory.count += 1;
            world.write_model(@inventory);

            // --- Update node quantity ---
            node.quantity = node.quantity.saturating_sub(1);

            if node.quantity == 0 {
                node.active = false; // mark as inactive (can be replaced later)
                dojo::print!("This node has been depleted!");
            } else {
                node.respawn_epoch = current_block.into() + NODE_RESPAWN_DURATION;
            }

            world.write_model(@node);

            // --- Reduce player stamina ---
            player.stamina = player.stamina.saturating_sub(FORAGE_STAMINA_COST);
            world.write_model(@player);

            dojo::print!("You successfully foraged an ingredient!");
        }
    }

    // Internal helper for world reference
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc")
        }
    }
}
