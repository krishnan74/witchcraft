use crate::models::{
    IngredientNode,
};

#[starknet::interface]
pub trait IResourceRegenerationSystem<T> {
    fn tick_regeneration(ref self: T);
}

#[dojo::contract]
pub mod resource_regeneration_system {
    use super::{
        IResourceRegenerationSystem, IngredientNode,
    };
    use dojo::model::ModelStorage;

    // Constants / Game Balancing
    pub const BASE_NODE_QUANTITY: u16 = 5; // Default quantity when regenerating

    #[abi(embed_v0)]
    impl ResourceRegenerationSystemImpl of IResourceRegenerationSystem<ContractState> {
        fn tick_regeneration(ref self: ContractState) {
            // Note: In a full implementation, this would iterate through all nodes
            // For now, this is a placeholder that can be called with specific node IDs
            // In practice, you would query all IngredientNode models and check each one
            
            // This function is intended to be called periodically (by admin or keeper)
            // to regenerate depleted nodes that have passed their respawn_epoch
            
            // Implementation note: Since Dojo doesn't support full model queries without keys,
            // you would need to track node IDs separately or iterate through known coordinate ranges
            // For demonstration, we'll create a helper that can regenerate a specific node
            
            // dojo::print!("Regeneration tick processed");
        }
    }

    // ------------------------------
    // Internal helper functions
    // ------------------------------

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn regenerate_node(
            self: @ContractState,
            node_id: felt252,
            ref world: dojo::world::WorldStorage,
        ) {
            let mut node: IngredientNode = world.read_model(node_id);
            
            // Check if node actually exists (node_id matches)
            if node.node_id != node_id {
                return;
            }

            // Check if node should be regenerated
            let current_block = starknet::get_block_number();
            if current_block.into() >= node.respawn_epoch && !node.active {
                // Reactivate node
                node.active = true;
                node.quantity = BASE_NODE_QUANTITY;
                
                world.write_model(@node);
                // In a full implementation, you would log "Node respawned"
            }
        }

        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc")
        }
    }
}

