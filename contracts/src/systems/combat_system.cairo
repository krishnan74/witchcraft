use crate::models::{
    Player, CombatEntity, CombatEntityType, CreatureLoot, Inventory, IngredientItem, Position, PlayerProgression, FactionReputation, Faction,
};

#[starknet::interface]
pub trait ICombatSystem<T> {
    fn attack(ref self: T, target_id: felt252);
}

#[dojo::contract]
pub mod combat_system {
    use super::{
        ICombatSystem, Player, CombatEntity, CombatEntityType, CreatureLoot,
        Inventory, IngredientItem, Position, PlayerProgression, FactionReputation, Faction,
    };
    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use core::num::traits::{SaturatingSub, SaturatingAdd};

    // Constants / Game Balancing
    pub const COMBAT_STAMINA_COST: u16 = 15;
    pub const MIN_DAMAGE: u16 = 1;
    pub const PLAYER_BASE_ATTACK: u16 = 10;
    pub const PLAYER_BASE_DEFENSE: u16 = 5;
    pub const COMBAT_XP_REWARD: u32 = 20;
    pub const COMBAT_PROXIMITY_MAX: u32 = 1; // Max distance for combat (1 tile)

    #[abi(embed_v0)]
    impl CombatSystemImpl of ICombatSystem<ContractState> {
        fn attack(ref self: ContractState, target_id: felt252) {
            let mut world = self.world_default();
            let attacker_addr = starknet::get_caller_address();

            // Load attacker (player)
            let mut attacker: Player = world.read_model(attacker_addr);
            let attacker_position: Position = world.read_model(attacker_addr);

            // Check stamina
            if attacker.stamina < COMBAT_STAMINA_COST {
                panic!("Not enough stamina to attack!");
            }

            // Check if attacker is alive
            if attacker.health == 0 {
                panic!("Attacker is dead!");
            }

            // Load target (combat entity)
            let mut target: CombatEntity = world.read_model(target_id);
            
            // Check proximity (simplified - in full implementation, target would have Position)
            // For now, we'll skip proximity check for CombatEntity targets
            // In a full game, you'd load target position and verify distance

            // Check if target is alive
            if !target.alive {
                panic!("Target is already dead!");
            }

            // Calculate attack and defense
            let attacker_attack = if target.entity_type == CombatEntityType::Player {
                // If attacking a player, use their player stats
                PLAYER_BASE_ATTACK
            } else {
                PLAYER_BASE_ATTACK
            };

            let target_defense = target.defense;

            // Compute damage: attacker.attack - target.defense (minimum 1)
            let raw_damage = attacker_attack.saturating_sub(target_defense);
            let damage = if raw_damage == 0 { MIN_DAMAGE } else { raw_damage };

            // Apply damage to target
            if damage >= target.health {
                target.health = 0;
                target.alive = false;
            } else {
                target.health = target.health.saturating_sub(damage);
            }

            // If target is dead, handle loot and rewards
            if !target.alive {
                self.handle_loot(target_id, attacker_addr, ref world);
                // Award XP for defeating enemy
                self.award_xp(attacker_addr, COMBAT_XP_REWARD, ref world);
                // Adjust faction reputation based on target type
                if target.entity_type == CombatEntityType::Creature {
                    // Defeating creatures may affect faction reputation
                    // Simplified: increase reputation with a neutral faction
                    self.adjust_reputation(attacker_addr, Faction::Demon, 1, ref world);
                }
            }

            // Update target
            world.write_model(@target);

            // Deduct stamina cost from attacker
            attacker.stamina = attacker.stamina.saturating_sub(COMBAT_STAMINA_COST);
            world.write_model(@attacker);
        }
    }

    // ------------------------------
    // Internal helper functions
    // ------------------------------

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn handle_loot(
            self: @ContractState,
            creature_id: felt252,
            player_addr: ContractAddress,
            ref world: dojo::world::WorldStorage,
        ) {
            // Try to read loot - if it doesn't exist, creature_id won't match
            let loot: CreatureLoot = world.read_model(creature_id);
            
            // Check if loot actually exists (creature_id matches)
            if loot.creature_id != creature_id {
                return;
            }

            let mut player: Player = world.read_model(player_addr);
            let mut inventory: Inventory = world.read_model(player_addr);

            // Add gold reward (u32 -> u128 conversion)
            let reward_gold_u128: u128 = loot.reward_gold.into();
            player.gold = player.gold.saturating_add(reward_gold_u128);
            world.write_model(@player);

            // Add item to inventory if there's space
            if inventory.count < inventory.capacity && loot.quantity > 0 {
                let item = IngredientItem {
                    slot: inventory.count,
                    owner: player_addr,
                    ingredient_type: loot.reward_item,
                    quantity: loot.quantity,
                };
                world.write_model(@item);
                inventory.count += 1;
                world.write_model(@inventory);
            }
        }

        fn award_xp(
            self: @ContractState,
            player_addr: ContractAddress,
            amount: u32,
            ref world: dojo::world::WorldStorage,
        ) {
            // Load or create progression
            let mut progression: PlayerProgression = world.read_model(player_addr);
            
            // Check if it exists (player matches)
            if progression.player != player_addr {
                progression = PlayerProgression {
                    player: player_addr,
                    level: 1,
                    xp: 0,
                    next_level_xp: 100,
                };
            }

            // Increase XP
            progression.xp = progression.xp.saturating_add(amount);

            // Check for level up (simplified - full logic in progression_system)
            if progression.xp >= progression.next_level_xp && progression.level < 50 {
                progression.xp = progression.xp.saturating_sub(progression.next_level_xp);
                progression.level += 1;
                // Calculate next level XP requirement
                let level_factor = (progression.level.into() * 15) / 100;
                progression.next_level_xp = 100.saturating_add(level_factor);
            }

            world.write_model(@progression);
        }

        fn adjust_reputation(
            self: @ContractState,
            player_addr: ContractAddress,
            faction: Faction,
            delta: i32,
            ref world: dojo::world::WorldStorage,
        ) {
            // Load or create faction reputation
            let mut faction_rep: FactionReputation = world.read_model((player_addr, faction));
            
            // Check if it exists (player matches)
            if faction_rep.player != player_addr {
                faction_rep = FactionReputation {
                    player: player_addr,
                    faction,
                    reputation: 0,
                };
            }

            // Add reputation points, cap at ±100
            let new_reputation = faction_rep.reputation.saturating_add(delta);
            if new_reputation > 100 {
                faction_rep.reputation = 100;
            } else if new_reputation < -100 {
                faction_rep.reputation = -100;
            } else {
                faction_rep.reputation = new_reputation;
            }

            world.write_model(@faction_rep);
        }

        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"wc")
        }
    }
}

