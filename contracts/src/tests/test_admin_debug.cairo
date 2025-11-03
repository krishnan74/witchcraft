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

    use witchcraft::systems::admin_system::{admin_system, IAdminSystemDispatcher, IAdminSystemDispatcherTrait};
    
    use witchcraft::models::{
        CombatEntity, m_CombatEntity,
        CombatEntityType,
    };

    fn namespace_def() -> NamespaceDef {
        NamespaceDef {
            namespace: "witchcraft",
            resources: [
                // Models
                TestResource::Model(m_CombatEntity::TEST_CLASS_HASH),
                // Systems
                TestResource::Contract(admin_system::TEST_CLASS_HASH),
            ].span()
        }
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@"witchcraft", @"admin_system")
                .with_writer_of([dojo::utils::bytearray_hash(@"witchcraft")].span()),
        ].span()
    }

    #[test]
    #[available_gas(60000000)]
    fn test_debug_create_combat_entity() {
        println!("");
        println!("=======================================");
        println!("DEBUG: CREATE COMBAT ENTITY TEST");
        println!("=======================================");
        println!("");

        // STEP 0: Setup world
        println!("[SETUP] Creating test world...");
        let caller = starknet::contract_address_const::<0x1234>();
        testing::set_contract_address(caller);
        let ndef = namespace_def();
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());
        world.sync_perms_and_inits(contract_defs());
        println!("World initialized successfully.\n");

        // STEP 1: Fetch admin system dispatcher
        println!("[SYSTEMS] Fetching admin system dispatcher...");
        let (admin_addr, _) = world.dns(@"admin_system").unwrap();
        let admin_system_dispatcher = IAdminSystemDispatcher { contract_address: admin_addr };
        println!("Admin system dispatcher fetched.\n");

        // STEP 2: Check existing entities before creation
        println!("[DEBUG] Checking existing entities before creation...");
        let test_id: felt252 = 100000;
        let existing_before: CombatEntity = world.read_model(test_id);
        println!("Entity at ID 100000: id={},  health={}, attack={}, defense={}, alive={}", 
            existing_before.id, existing_before.health, 
            existing_before.attack, existing_before.defense, existing_before.alive);
        println!("existing_before.id == 0: {}", existing_before.id == 0);
        println!("");

        // STEP 3: Create combat entity
        println!("[STEP 1] Creating combat entity...");
        println!("Calling create_combat_entity with: entity_type={}, health={}, attack={}, defense={}", 
            'Creature', 100, 10, 5);
        
        let entity_id = admin_system_dispatcher.create_combat_entity(
            CombatEntityType::Creature,
            100,
            10,
            5
        );
        
        println!("");
        println!("[RESULT] Entity created with ID: {}", entity_id);
        println!("");

        // STEP 4: Verify entity was created
        println!("[STEP 2] Verifying entity creation...");
        let created_entity: CombatEntity = world.read_model(entity_id);
        println!("Created entity details:");
        println!("  id: {}", created_entity.id);
        // println!("  entity_type: {}", created_entity.entity_type);
        println!("  health: {}", created_entity.health);
        println!("  attack: {}", created_entity.attack);
        println!("  defense: {}", created_entity.defense);
        println!("  alive: {}", created_entity.alive);
        println!("");

        // STEP 5: Check multiple IDs around the created entity
        println!("[STEP 3] Checking IDs around created entity...");
        let start_offset: u32 = 5;
        let mut offset: u32 = 0;
        let max_offset: u32 = 10; // Check 11 IDs total (5 before, entity, 5 after)
        
        while offset <= max_offset {
            let check_id = entity_id - start_offset.into() + offset.into();
            let check_entity: CombatEntity = world.read_model(check_id);
            if check_entity.id != 0 {
                println!("  ID {}: EXISTS (id={}, health={})", check_id, check_entity.id, check_entity.health);
            } else {
                println!("  ID {}: FREE (id=0)", check_id);
            }
            offset += 1;
        }
        println!("");

        // STEP 6: Try creating another entity
        println!("[STEP 4] Creating second combat entity...");
        let entity_id_2 = admin_system_dispatcher.create_combat_entity(
            CombatEntityType::Boss,
            200,
            20,
            10
        );
        println!("Second entity created with ID: {}", entity_id_2);
        println!("");

        println!("=======================================");
        println!(" DEBUG TEST COMPLETE ");
        println!("=======================================");
        println!("");
    }
}

