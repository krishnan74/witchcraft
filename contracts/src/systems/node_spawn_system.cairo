use crate::models::{
    IngredientNode, IngredientType,
};

#[starknet::interface]
pub trait INodeSpawnSystem<T> {
    fn spawn_node(ref self: T, x: u32, y: u32, ingredient_type: IngredientType, rarity: u8, quantity: u16);
}

#[dojo::contract]
pub mod node_spawn_system {
    use super::{INodeSpawnSystem, IngredientNode, IngredientType};
    use dojo::model::ModelStorage;

    // Constants / Game Balance
    pub const NODE_RESPAWN_BASE_TIME: u64 = 500; // time until regrowth after depletion

    #[abi(embed_v0)]
    impl NodeSpawnImpl of INodeSpawnSystem<ContractState> {
        fn spawn_node(
            ref self: ContractState,
            x: u32,
            y: u32,
            ingredient_type: IngredientType,
            rarity: u8,
            quantity: u16
        ) {
            let mut world = self.world_default();

            // Get deterministic node_id from coordinates
            let node_id: felt252 = (x * 1000 + y).into();

            let mut existing_node: IngredientNode = world.read_model(node_id);

            // Check if a node already exists and is active
            let is_existing = existing_node.x != 0 || existing_node.y != 0; // non-default means it exists
            if is_existing && existing_node.quantity > 0 {
                panic!(" A node already exists and is not depleted!");
            }

            // Setup respawn and spawn the node
            let current_block = starknet::get_block_number();
            let respawn_epoch = current_block.into() + NODE_RESPAWN_BASE_TIME;

            let node = IngredientNode {
                node_id,
                ingredient_type,
                rarity,
                respawn_epoch,
                x,
                y,
                quantity,
                active: true,
            };

            world.write_model(@node);
            dojo::print!("Ingredient node spawned successfully!");
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
