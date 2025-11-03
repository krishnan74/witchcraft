#[cfg(test)]
mod tests {
    use starknet::{testing, get_block_info};
    use dojo_cairo_test::WorldStorageTestTrait;
    use dojo::world::world;
    use dojo::model::{ModelStorage, ModelValueStorage, ModelStorageTest};
    use dojo::world::WorldStorageTrait;
    use dojo::world::WorldStorage;
    use dojo::world::IWorldDispatcherTrait;
    use dojo_cairo_test::{spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef};

    use witchcraft::systems::spawn_system::{spawn_system, ISpawnSystemDispatcher, ISpawnSystemDispatcherTrait};
    use witchcraft::systems::movement_system::{movement_system, IMovementSystemDispatcher, IMovementSystemDispatcherTrait};
    use witchcraft::systems::node_spawn_system::{node_spawn_system, INodeSpawnSystemDispatcher, INodeSpawnSystemDispatcherTrait};
    use witchcraft::systems::forage_system::{forage_system, IForageSystemDispatcher, IForageSystemDispatcherTrait};
    use witchcraft::systems::brewing_system::{brewing_system, IBrewingSystemDispatcher, IBrewingSystemDispatcherTrait};

    use witchcraft::models::{
        Player, m_Player,
        Position, m_Position,
        Inventory, m_Inventory,
        IngredientNode, m_IngredientNode,
        IngredientItem, m_IngredientItem,
        Cauldron, m_Cauldron,
        Recipe, m_Recipe,
        Potion, m_Potion,
        FactionReputation, m_FactionReputation,
        ZoneType,
        Faction,
        IngredientType,
        Direction
    };

    fn namespace_def() -> NamespaceDef {
        NamespaceDef {
            namespace: "witchcraft",
            resources: [
                // Models
                TestResource::Model(m_Player::TEST_CLASS_HASH),
                TestResource::Model(m_Position::TEST_CLASS_HASH),
                TestResource::Model(m_Inventory::TEST_CLASS_HASH),
                TestResource::Model(m_IngredientNode::TEST_CLASS_HASH),
                TestResource::Model(m_IngredientItem::TEST_CLASS_HASH),
                TestResource::Model(m_Cauldron::TEST_CLASS_HASH),
                TestResource::Model(m_Recipe::TEST_CLASS_HASH),
                TestResource::Model(m_Potion::TEST_CLASS_HASH),
                TestResource::Model(m_FactionReputation::TEST_CLASS_HASH),

                // Systems
                TestResource::Contract(spawn_system::TEST_CLASS_HASH), 
                TestResource::Contract(movement_system::TEST_CLASS_HASH),
                TestResource::Contract(node_spawn_system::TEST_CLASS_HASH),
                TestResource::Contract(forage_system::TEST_CLASS_HASH),
                TestResource::Contract(brewing_system::TEST_CLASS_HASH),
            ].span()
        }
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@"witchcraft", @"spawn_system")
                .with_writer_of([dojo::utils::bytearray_hash(@"witchcraft")].span()),
            ContractDefTrait::new(@"witchcraft", @"movement_system")
                .with_writer_of([dojo::utils::bytearray_hash(@"witchcraft")].span()),
            ContractDefTrait::new(@"witchcraft", @"node_spawn_system")
                .with_writer_of([dojo::utils::bytearray_hash(@"witchcraft")].span()),
            ContractDefTrait::new(@"witchcraft", @"forage_system")
                .with_writer_of([dojo::utils::bytearray_hash(@"witchcraft")].span()),
            ContractDefTrait::new(@"witchcraft", @"brewing_system")
                .with_writer_of([dojo::utils::bytearray_hash(@"witchcraft")].span()),
        ].span()
    }

    // -----------------------------------------------
    // WITCHCRAFT — FULL MVP TEST FLOW
    // -----------------------------------------------
    #[test]
    #[available_gas(60000000)]
    fn test_full_witchcraft_mvp() {
        // println!("");
        // println!("=======================================");
        // println!("WITCHCRAFT FULL MVP TEST FLOW");
        // println!("=======================================");
        // println!("");

        // STEP 0: Setup world
        // println!("[SETUP] Creating test world...");

        let caller = starknet::contract_address_const::<0x1234>();
        testing::set_contract_address(caller);
        let ndef = namespace_def();
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());
        world.sync_perms_and_inits(contract_defs());

        // println!("World initialized successfully.\n");

        // STEP 1: Fetch system dispatchers
        // println!("[SYSTEMS] Fetching system dispatchers...");
        let (spawn_addr, _) = world.dns(@"spawn_system").unwrap();
        let spawn_system = ISpawnSystemDispatcher { contract_address: spawn_addr };

        let (movement_addr, _) = world.dns(@"movement_system").unwrap();
        let movement_system = IMovementSystemDispatcher { contract_address: movement_addr };

        let (node_spawn_addr, _) = world.dns(@"node_spawn_system").unwrap();
        let node_spawn_system = INodeSpawnSystemDispatcher { contract_address: node_spawn_addr };

        let (forage_addr, _) = world.dns(@"forage_system").unwrap();
        let forage_system = IForageSystemDispatcher { contract_address: forage_addr };

        let (brew_addr, _) = world.dns(@"brewing_system").unwrap();
        let brew_system = IBrewingSystemDispatcher { contract_address: brew_addr };

        // println!("System dispatchers fetched successfully.\n");

        // STEP 2: Player Spawn
        // println!("[STEP 1] Spawning player...");
        let player_name: felt252 = 'TestPlayer';
        spawn_system.spawn_player(player_name);

        let player: Player = world.read_model(caller);
        // println!("Player spawned: {:?} | Gold: {} | Health: {} | Stamina: {}", 
        //     player.name, player.gold, player.health, player.stamina);
        assert(player.name == player_name, 'Player spawn failed');

        // STEP 3: Movement System
        let player_position: Position = world.read_model(caller);
        // println!("Current position: ({}, {})", player_position.x, player_position.y);

        movement_system.move_player(Direction::Up);
        let player_position: Position = world.read_model(caller);
        // println!("Moved Up -> New position: ({}, {})\n", player_position.x, player_position.y);

        // STEP 4: Spawn Ingredient Node
        // println!("[STEP 2] Spawning ingredient node...");
        let x: u32 = 5;
        let y: u32 = 7;
        node_spawn_system.spawn_node(x, y, IngredientType::BatWing, 1, 3);

        let node_id: felt252 = (x * 1000 + y).into();
        let node: IngredientNode = world.read_model(node_id);
        // println!("Node spawned: {:?} | Quantity: {} | Position: ({}, {})", 
        //     node.ingredient_type, node.quantity, node.x, node.y);
        assert(node.quantity == 3, 'Node spawn failed');
        // println!("");

        // STEP 5: Foraging
        // println!("[STEP 3] Foraging ingredients...");
        movement_system.move_player(Direction::Up);
        let player_position: Position = world.read_model(caller);
        // println!("Player moved to ({}, {})", player_position.x, player_position.y);

        testing::set_block_number(get_block_info().block_number + 500);
        forage_system.forage();

        let inventory_after: Inventory = world.read_model(caller);
        // println!("Inventory updated. Count: {}", inventory_after.count);
        assert(inventory_after.count == 1, 'Inventory not updated');

        let item: IngredientItem = world.read_model((caller, 0));
        // println!("Foraged Item: {:?} | Quantity: {}", item.ingredient_type, item.quantity);
        // println!("");

        // STEP 6: Brewing Setup
        // println!("[STEP 4] Setting up cauldron and recipe...");
        let cauldron_id: felt252 = 999.into();
        let cauldron = Cauldron {
            cauldron_id,
            owner: caller,
            quality: 10,
            busy: false,
            recipe_id: 0.into(),
            brewing_until: 0,
        };
        world.write_model_test(@cauldron);

        let recipe_id: felt252 = 777.into();
        let recipe = Recipe {
            recipe_id,
            name: 'Bat Brew',
            difficulty: 5,
            base_time: 5,
            base_value: 10,
            effect: witchcraft::models::PotionEffect::Healing
        };
        world.write_model_test(@recipe);

        // println!("Cauldron and recipe registered successfully.\n");

        // STEP 7: Brewing Process
        // println!("[STEP 5] Starting brewing process...");
        brew_system.start_brew(cauldron_id, recipe_id);

        let mut cauldron_after: Cauldron = world.read_model((caller, cauldron_id));

        // println!("Cauldron brewing status: {}", cauldron_after.busy);
        assert(cauldron_after.busy, 'Cauldron should be brewing');

        cauldron_after.brewing_until = 0;
        world.write_model_test(@cauldron_after);

        // println!("Finishing started for  brewing process...");

        brew_system.finish_brew(cauldron_id);

        // println!("Brewing process finished.");

        let potion_id: felt252 = (caller.into() + cauldron_id).into();

        let potion: Potion = world.read_model(potion_id);
        // println!("Potion brewed successfully. Quality: {}", potion.quality);
        assert(potion.quality > 0, 'Potion not created');

        // println!("");
        // println!("=======================================");
        // println!(" ALL TESTS PASSED SUCCESSFULLY ");
        // println!("=======================================");

    }
}
