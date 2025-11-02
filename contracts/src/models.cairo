use starknet::ContractAddress;


#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Player {
    #[key]
    pub addr: ContractAddress,
    pub name: felt252,
    pub gold: u128,
    pub health: u16,
    pub stamina: u16,
    pub reputation: i32, 
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Position {
    #[key]
    pub owner: ContractAddress,
    pub x: u32,
    pub y: u32,
    pub zone: ZoneType,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct IngredientNode {
    #[key]
    pub node_id: felt252,             // unique identifier (derived from position or generated)
    pub ingredient_type: IngredientType,
    pub rarity: u8,
    pub respawn_epoch: u64,
    pub x: u32,
    pub y: u32,
    pub quantity: u16,                // number of times it can be foraged before depletion
    pub active: bool,                 // true = node is valid and collectible
}


#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Inventory {
    #[key]
    pub owner: ContractAddress,
    pub capacity: u16,
    pub count: u16,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct IngredientItem {
    #[key]
    pub owner: ContractAddress,
    #[key]
    pub slot: u16,
    pub ingredient_type: IngredientType,
    pub quantity: u16,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Cauldron {
    #[key]
    pub owner: ContractAddress,
    #[key]
    pub cauldron_id: felt252, 
    pub quality: u8,
    pub brewing_until: u64,
    pub recipe_id: felt252,
    pub busy: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Potion {
    #[key]
    pub potion_id: felt252,
    pub owner: ContractAddress,
    pub recipe_id: felt252,
    pub effect: PotionEffect,
    pub quality: u8,
    pub value: u128,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Recipe {
    #[key]
    pub recipe_id: felt252,
    pub name: felt252,
    pub effect: PotionEffect,
    pub difficulty: u8,
    pub base_time: u64,
    pub base_value: u128,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct RecipeIngredient {
    #[key]
    pub recipe_id: felt252,
    #[key]
    pub ingredient_type: IngredientType,
    pub quantity: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Customer {
    #[key]
    pub id: felt252,
    pub faction: Faction,
    pub reputation_req: i32,
    pub preferred_recipe: felt252,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Order {
    #[key]
    pub order_id: felt252,
    pub buyer_id: felt252,
    pub recipe_id: felt252,
    pub price: u128,
    pub deadline_epoch: u64,
    pub fulfilled: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct FactionReputation {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub faction: Faction,
    pub reputation: i32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct WorldState {
    #[key]
    pub id: felt252,
    pub day: u8,
    pub time_of_day: TimeOfDay,
    pub moon_phase: MoonPhase,
    pub human_alert_level: u8,
}


#[derive(Drop, Serde, DojoStore, Default, Introspect, Copy, Debug, PartialEq)]
pub enum IngredientType {
    #[default]
    MandrakeRoot,
    GraveDust,
    BatWing,
    GhostMushroom,
    WyrmScale,
    VampireBloom,
    PumpkinSeed,
}

#[derive(Drop, Serde, DojoStore, Default, Introspect, Copy)]
pub enum PotionEffect {
    #[default]
    Healing,
    Rage,
    Invisibility,
    FearAura,
    Speed,
    FireResistance,
    Transformation,
    Curse,
}

#[derive(Drop, Serde, DojoStore, Default, Introspect, Copy)]
pub enum Faction {
    #[default]
    Demon,
    Zombie,
    Vampire,
    Ghost,
    HumanHunter,
}

#[derive(Drop, Serde, DojoStore, Default, Introspect, Copy)]
pub enum ZoneType {
    #[default]
    Forest,
    Swamp,
    Graveyard,
    CursedVillage,
    Ruins,
    MountainPass,
}

#[derive(Drop, Serde, DojoStore, Default, Introspect, Copy)]
pub enum Direction {
    #[default]
    Left,
    Right,
    Up,
    Down,
}

#[derive(Drop, Serde, DojoStore, Default, Introspect, Copy)]
pub enum TimeOfDay {
    #[default]
    Day,
    Night,
}

#[derive(Drop, Serde, DojoStore, Default, Introspect, Copy)]
pub enum MoonPhase {
    #[default]
    New,
    Crescent,
    Half,
    Gibbous,
    Full,
}
