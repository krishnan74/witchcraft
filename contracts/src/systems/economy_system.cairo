use crate::models::{
    Player, MarketListing, Inventory, IngredientItem, IngredientType,
};

#[starknet::interface]
pub trait IEconomySystem<T> {
    fn list_item(ref self: T, item_slot: u16, price: u128);
    fn buy_item(ref self: T, listing_id: felt252);
    fn cancel_listing(ref self: T, listing_id: felt252);
}

#[dojo::contract]
pub mod economy_system {
    use super::{
        IEconomySystem, Player, MarketListing, Inventory, IngredientItem, IngredientType,
    };
    use dojo::model::ModelStorage;
    use core::num::traits::{SaturatingAdd, SaturatingSub};

    // Constants / Game Balancing
    pub const LISTING_FEE: u128 = 1; // Optional fee for listing items

    #[abi(embed_v0)]
    impl EconomySystemImpl of IEconomySystem<ContractState> {
        fn list_item(ref self: ContractState, item_slot: u16, price: u128) {
            let mut world = self.world_default();
            let seller_addr = starknet::get_caller_address();

            // Load player and inventory
            let seller: Player = world.read_model(seller_addr);
            let inventory: Inventory = world.read_model(seller_addr);

            // Check item slot is valid
            if item_slot >= inventory.count {
                panic!("Invalid item slot!");
            }

            // Load the item
            let mut item: IngredientItem = world.read_model((seller_addr, item_slot));

            // Verify ownership
            if item.owner != seller_addr || item.quantity == 0 {
                panic!("Item not found or already empty!");
            }

            // Create listing
            let seller_addr_felt: felt252 = seller_addr.into();
            let item_slot_felt: felt252 = item_slot.into();
            let listing_id: felt252 = (seller_addr_felt + item_slot_felt);
            let item_type_felt = self.ingredient_type_to_felt(item.ingredient_type);
            let listing = MarketListing {
                listing_id,
                item_type: item_type_felt,
                price,
                quantity: item.quantity,
                seller: seller_addr,
                active: true,
            };

            world.write_model(@listing);

            // Remove item from inventory (set quantity to 0)
            item.quantity = 0;
            world.write_model(@item);

            // Update inventory count
            let mut updated_inventory = inventory;
            // Note: In a full implementation, you'd want to compact the inventory
            // For now, we just set quantity to 0
            world.write_model(@updated_inventory);
        }

        fn buy_item(ref self: ContractState, listing_id: felt252) {
            let mut world = self.world_default();
            let buyer_addr = starknet::get_caller_address();

            // Load listing
            let mut listing: MarketListing = world.read_model(listing_id);

            if !listing.active {
                panic!("Listing is not active!");
            }

            if listing.seller == buyer_addr {
                panic!("Cannot buy your own listing!");
            }

            // Load buyer and seller
            let mut buyer: Player = world.read_model(buyer_addr);
            let mut seller: Player = world.read_model(listing.seller);

            // Check buyer has enough gold
            if buyer.gold < listing.price {
                panic!("Not enough gold to buy item!");
            }

            // Load buyer inventory
            let mut buyer_inventory: Inventory = world.read_model(buyer_addr);

            // Check inventory space
            if buyer_inventory.count >= buyer_inventory.capacity {
                panic!("Buyer inventory is full!");
            }

            // Deduct gold from buyer
            buyer.gold = buyer.gold.saturating_sub(listing.price);

            // Add gold to seller
            seller.gold = seller.gold.saturating_add(listing.price);

            // Convert item_type back to IngredientType
            let ingredient_type = self.felt_to_ingredient_type(listing.item_type);

            // Add item to buyer's inventory
            let item = IngredientItem {
                slot: buyer_inventory.count,
                owner: buyer_addr,
                ingredient_type,
                quantity: listing.quantity,
            };
            world.write_model(@item);

            buyer_inventory.count += 1;
            world.write_model(@buyer_inventory);

            // Mark listing as inactive
            listing.active = false;
            world.write_model(@listing);

            // Update players
            world.write_model(@buyer);
            world.write_model(@seller);
        }

        fn cancel_listing(ref self: ContractState, listing_id: felt252) {
            let mut world = self.world_default();
            let seller_addr = starknet::get_caller_address();

            // Load listing
            let mut listing: MarketListing = world.read_model(listing_id);

            if listing.seller != seller_addr {
                panic!("Not your listing!");
            }

            if !listing.active {
                panic!("Listing is already inactive!");
            }

            // Load seller inventory
            let mut inventory: Inventory = world.read_model(seller_addr);

            // Check inventory space
            if inventory.count >= inventory.capacity {
                panic!("Inventory is full! Cannot return item.");
            }

            // Convert item_type back to IngredientType
            let ingredient_type = self.felt_to_ingredient_type(listing.item_type);

            // Return item to inventory
            let item = IngredientItem {
                slot: inventory.count,
                owner: seller_addr,
                ingredient_type,
                quantity: listing.quantity,
            };
            world.write_model(@item);

            inventory.count += 1;
            world.write_model(@inventory);

            // Mark listing as inactive
            listing.active = false;
            world.write_model(@listing);
        }
    }

    // ------------------------------
    // Internal helper functions
    // ------------------------------

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn ingredient_type_to_felt(self: @ContractState, ingredient_type: IngredientType) -> felt252 {
            // Convert enum variant to felt252 by using its discriminant
            match ingredient_type {
                IngredientType::MandrakeRoot => 0.into(),
                IngredientType::GraveDust => 1.into(),
                IngredientType::BatWing => 2.into(),
                IngredientType::GhostMushroom => 3.into(),
                IngredientType::WyrmScale => 4.into(),
                IngredientType::VampireBloom => 5.into(),
                IngredientType::PumpkinSeed => 6.into(),
            }
        }

        fn felt_to_ingredient_type(self: @ContractState, felt: felt252) -> IngredientType {
            // Convert felt252 back to enum variant
            // Simple approach: use match on common enum discriminant values
            if felt == 0 {
                IngredientType::MandrakeRoot
            } else if felt == 1 {
                IngredientType::GraveDust
            } else if felt == 2 {
                IngredientType::BatWing
            } else if felt == 3 {
                IngredientType::GhostMushroom
            } else if felt == 4 {
                IngredientType::WyrmScale
            } else if felt == 5 {
                IngredientType::VampireBloom
            } else {
                IngredientType::PumpkinSeed
            }
        }

        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc")
        }
    }
}

