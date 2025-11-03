import React, { useState } from 'react';
import { useDojoHook, CombatEntityType, CraftResultType, IngredientType, Faction } from '../hooks/useDojo.ts';
import { generateUUID4, uuidToFelt252 } from '../utils/uuid.ts';

/**
 * Admin Panel Component
 * Allows game managers/admins to create game models
 */
export default function AdminPanel() {
  const {
    // Admin functions
    createCombatEntity,
    createCreatureLoot,
    createCraftRecipe,
    addCraftIngredient,
    createZone,
    createPotionRecipe,
    addRecipeIngredient,
    createCustomer,
    isPending,
    error,
    isSdkReady,
  } = useDojoHook();

  // Combat Entity State
  const [entityId, setEntityId] = useState('');
  const [entityType, setEntityType] = useState<CombatEntityType>(CombatEntityType.Creature);
  const [entityHealth, setEntityHealth] = useState(100);
  const [entityAttack, setEntityAttack] = useState(10);
  const [entityDefense, setEntityDefense] = useState(5);

  // Creature Loot State
  const [creatureId, setCreatureId] = useState('');
  const [lootGold, setLootGold] = useState(50);
  const [lootItem, setLootItem] = useState<IngredientType>(IngredientType.BatWing);
  const [lootQuantity, setLootQuantity] = useState(1);

  // Craft Recipe State
  const [craftRecipeId, setCraftRecipeId] = useState('');
  const [resultType, setResultType] = useState<CraftResultType>(CraftResultType.Potion);
  const [craftDifficulty, setCraftDifficulty] = useState(5);
  const [craftBaseValue, setCraftBaseValue] = useState(100);

  // Craft Ingredient State
  const [craftIngredientRecipeId, setCraftIngredientRecipeId] = useState('');
  const [craftIngredientType, setCraftIngredientType] = useState<IngredientType>(IngredientType.MandrakeRoot);
  const [craftIngredientQty, setCraftIngredientQty] = useState(1);

  // Zone State
  const [zoneId, setZoneId] = useState(1);
  const [zoneType, setZoneType] = useState(0); // ZoneType enum value
  const [dangerLevel, setDangerLevel] = useState(1);
  const [nodeSpawnRate, setNodeSpawnRate] = useState(50);

  // Potion Recipe State
  const [potionRecipeId, setPotionRecipeId] = useState('');
  const [potionName, setPotionName] = useState('');
  const [potionEffect, setPotionEffect] = useState(0);
  const [potionDifficulty, setPotionDifficulty] = useState(5);
  const [potionBaseTime, setPotionBaseTime] = useState('100');
  const [potionBaseValue, setPotionBaseValue] = useState('100');

  // Recipe Ingredient State
  const [recipeIngredientId, setRecipeIngredientId] = useState('');
  const [recipeIngredientType, setRecipeIngredientType] = useState<IngredientType>(IngredientType.MandrakeRoot);
  const [recipeIngredientQty, setRecipeIngredientQty] = useState(1);

  // Customer State
  const [customerId, setCustomerId] = useState('');
  const [customerFaction, setCustomerFaction] = useState<Faction>(Faction.Demon);
  const [customerRepReq, setCustomerRepReq] = useState(0);
  const [customerPreferredRecipe, setCustomerPreferredRecipe] = useState('');

  const handleCreateCombatEntity = async () => {
    try {
      // ID is generated in Cairo, no need to provide it
      await createCombatEntity(entityType, entityHealth, entityAttack, entityDefense);
      alert(`✅ Combat entity created! ID was auto-generated in Cairo.`);
      // Clear form after success
      setEntityId('');
      setEntityHealth(100);
      setEntityAttack(10);
      setEntityDefense(5);
    } catch (err: any) {
      alert(`❌ Failed: ${err.message}`);
    }
  };

  const handleCreateCreatureLoot = async () => {
    if (!creatureId) {
      alert('Please enter creature ID');
      return;
    }
    try {
      await createCreatureLoot(creatureId, lootGold, lootItem, lootQuantity);
      alert('Creature loot created!');
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleCreateCraftRecipe = async () => {
    try {
      await createCraftRecipe(resultType, craftDifficulty, craftBaseValue);
      alert('✅ Craft recipe created! ID was auto-generated in Cairo.');
      setCraftRecipeId('');
    } catch (err: any) {
      alert(`❌ Failed: ${err.message}`);
    }
  };

  const handleAddCraftIngredient = async () => {
    if (!craftIngredientRecipeId) {
      alert('Please enter recipe ID');
      return;
    }
    try {
      await addCraftIngredient(craftIngredientRecipeId, craftIngredientType, craftIngredientQty);
      alert('Craft ingredient added!');
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleCreateZone = async () => {
    try {
      await createZone(zoneId, zoneType, dangerLevel, nodeSpawnRate);
      alert('Zone created!');
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleCreatePotionRecipe = async () => {
    if (!potionName) {
      alert('Please enter recipe name');
      return;
    }
    try {
      const baseTime = BigInt(potionBaseTime);
      const baseValue = BigInt(potionBaseValue);
      await createPotionRecipe(potionName, potionEffect, potionDifficulty, baseTime, baseValue);
      alert('✅ Potion recipe created! ID was auto-generated in Cairo.');
      setPotionRecipeId('');
      setPotionName('');
    } catch (err: any) {
      alert(`❌ Failed: ${err.message}`);
    }
  };

  const handleAddRecipeIngredient = async () => {
    if (!recipeIngredientId) {
      alert('Please enter recipe ID');
      return;
    }
    try {
      await addRecipeIngredient(recipeIngredientId, recipeIngredientType, recipeIngredientQty);
      alert('Recipe ingredient added!');
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleCreateCustomer = async () => {
    if (!customerPreferredRecipe) {
      alert('Please enter preferred recipe ID');
      return;
    }
    try {
      await createCustomer(customerFaction, customerRepReq, customerPreferredRecipe);
      alert('✅ Customer created! ID was auto-generated in Cairo.');
      setCustomerId('');
      setCustomerPreferredRecipe('');
    } catch (err: any) {
      alert(`❌ Failed: ${err.message}`);
    }
  };

  if (!isSdkReady) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Waiting for SDK to initialize...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h1 style={{ color: '#d32f2f', borderBottom: '2px solid #d32f2f', paddingBottom: '10px' }}>🔧 Admin Panel</h1>

      {/* Combat Entity */}
      <section style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
            <h2>⚔️ Create Combat Entity</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div style={{ gridColumn: '1 / -1', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', marginBottom: '10px', fontSize: '14px' }}>
                ℹ️ Entity ID is automatically generated in Cairo using caller address, block number, and timestamp.
              </div>
          <div>
            <label>Entity Type: </label>
            <select value={entityType} onChange={(e) => setEntityType(parseInt(e.target.value) as CombatEntityType)} style={{ width: '100%', padding: '5px' }}>
              <option value={CombatEntityType.Player}>Player</option>
              <option value={CombatEntityType.Creature}>Creature</option>
              <option value={CombatEntityType.Boss}>Boss</option>
            </select>
          </div>
          <div>
            <label>Health: </label>
            <input type="number" value={entityHealth} onChange={(e) => setEntityHealth(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Attack: </label>
            <input type="number" value={entityAttack} onChange={(e) => setEntityAttack(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Defense: </label>
            <input type="number" value={entityDefense} onChange={(e) => setEntityDefense(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <button onClick={handleCreateCombatEntity} disabled={isPending} style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Create Combat Entity
        </button>
      </section>

      {/* Creature Loot */}
      <section style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
        <h2>💎 Create Creature Loot</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label>Creature ID: </label>
            <input type="text" value={creatureId} onChange={(e) => setCreatureId(e.target.value)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Reward Gold: </label>
            <input type="number" value={lootGold} onChange={(e) => setLootGold(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Reward Item: </label>
            <select value={lootItem} onChange={(e) => setLootItem(parseInt(e.target.value) as IngredientType)} style={{ width: '100%', padding: '5px' }}>
              <option value={IngredientType.MandrakeRoot}>MandrakeRoot</option>
              <option value={IngredientType.GraveDust}>GraveDust</option>
              <option value={IngredientType.BatWing}>BatWing</option>
              <option value={IngredientType.GhostMushroom}>GhostMushroom</option>
              <option value={IngredientType.WyrmScale}>WyrmScale</option>
              <option value={IngredientType.VampireBloom}>VampireBloom</option>
              <option value={IngredientType.PumpkinSeed}>PumpkinSeed</option>
            </select>
          </div>
          <div>
            <label>Quantity: </label>
            <input type="number" value={lootQuantity} onChange={(e) => setLootQuantity(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <button onClick={handleCreateCreatureLoot} disabled={isPending || !creatureId} style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Create Loot
        </button>
      </section>

      {/* Craft Recipe */}
      <section style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
        <h2>🧙 Create Craft Recipe</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div style={{ gridColumn: '1 / -1', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', marginBottom: '10px', fontSize: '14px' }}>
            ℹ️ Recipe ID is automatically generated in Cairo.
          </div>
          <div>
            <label>Result Type: </label>
            <select value={resultType} onChange={(e) => setResultType(parseInt(e.target.value) as CraftResultType)} style={{ width: '100%', padding: '5px' }}>
              <option value={CraftResultType.Potion}>Potion</option>
              <option value={CraftResultType.Charm}>Charm</option>
              <option value={CraftResultType.Tool}>Tool</option>
            </select>
          </div>
          <div>
            <label>Difficulty: </label>
            <input type="number" value={craftDifficulty} onChange={(e) => setCraftDifficulty(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Base Value: </label>
            <input type="number" value={craftBaseValue} onChange={(e) => setCraftBaseValue(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <button onClick={handleCreateCraftRecipe} disabled={isPending} style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Create Craft Recipe
        </button>
      </section>

      {/* Add Craft Ingredient */}
      <section style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
        <h2>➕ Add Craft Ingredient</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label>Recipe ID: </label>
            <input type="text" value={craftIngredientRecipeId} onChange={(e) => setCraftIngredientRecipeId(e.target.value)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Ingredient Type: </label>
            <select value={craftIngredientType} onChange={(e) => setCraftIngredientType(parseInt(e.target.value) as IngredientType)} style={{ width: '100%', padding: '5px' }}>
              <option value={IngredientType.MandrakeRoot}>MandrakeRoot</option>
              <option value={IngredientType.GraveDust}>GraveDust</option>
              <option value={IngredientType.BatWing}>BatWing</option>
              <option value={IngredientType.GhostMushroom}>GhostMushroom</option>
              <option value={IngredientType.WyrmScale}>WyrmScale</option>
              <option value={IngredientType.VampireBloom}>VampireBloom</option>
              <option value={IngredientType.PumpkinSeed}>PumpkinSeed</option>
            </select>
          </div>
          <div>
            <label>Quantity: </label>
            <input type="number" value={craftIngredientQty} onChange={(e) => setCraftIngredientQty(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <button onClick={handleAddCraftIngredient} disabled={isPending || !craftIngredientRecipeId} style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Ingredient
        </button>
      </section>

      {/* Create Zone */}
      <section style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
        <h2>🏰 Create Zone</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label>Zone ID: </label>
            <input type="number" value={zoneId} onChange={(e) => setZoneId(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Zone Type (0-5): </label>
            <input type="number" value={zoneType} onChange={(e) => setZoneType(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Danger Level (1-10): </label>
            <input type="number" value={dangerLevel} onChange={(e) => setDangerLevel(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Node Spawn Rate: </label>
            <input type="number" value={nodeSpawnRate} onChange={(e) => setNodeSpawnRate(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <button onClick={handleCreateZone} disabled={isPending} style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Create Zone
        </button>
      </section>

      {/* Create Potion Recipe */}
      <section style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
        <h2>🧪 Create Potion Recipe</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div style={{ gridColumn: '1 / -1', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', marginBottom: '10px', fontSize: '14px' }}>
            ℹ️ Recipe ID is automatically generated in Cairo.
          </div>
          <div>
            <label>Name: </label>
            <input type="text" value={potionName} onChange={(e) => setPotionName(e.target.value)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Effect (0-7): </label>
            <input type="number" value={potionEffect} onChange={(e) => setPotionEffect(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Difficulty: </label>
            <input type="number" value={potionDifficulty} onChange={(e) => setPotionDifficulty(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Base Time: </label>
            <input type="text" value={potionBaseTime} onChange={(e) => setPotionBaseTime(e.target.value)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Base Value: </label>
            <input type="text" value={potionBaseValue} onChange={(e) => setPotionBaseValue(e.target.value)} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <button onClick={handleCreatePotionRecipe} disabled={isPending || !potionName} style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Create Potion Recipe
        </button>
      </section>

      {/* Add Recipe Ingredient */}
      <section style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
        <h2>➕ Add Recipe Ingredient</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label>Recipe ID: </label>
            <input type="text" value={recipeIngredientId} onChange={(e) => setRecipeIngredientId(e.target.value)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Ingredient Type: </label>
            <select value={recipeIngredientType} onChange={(e) => setRecipeIngredientType(parseInt(e.target.value) as IngredientType)} style={{ width: '100%', padding: '5px' }}>
              <option value={IngredientType.MandrakeRoot}>MandrakeRoot</option>
              <option value={IngredientType.GraveDust}>GraveDust</option>
              <option value={IngredientType.BatWing}>BatWing</option>
              <option value={IngredientType.GhostMushroom}>GhostMushroom</option>
              <option value={IngredientType.WyrmScale}>WyrmScale</option>
              <option value={IngredientType.VampireBloom}>VampireBloom</option>
              <option value={IngredientType.PumpkinSeed}>PumpkinSeed</option>
            </select>
          </div>
          <div>
            <label>Quantity: </label>
            <input type="number" value={recipeIngredientQty} onChange={(e) => setRecipeIngredientQty(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <button onClick={handleAddRecipeIngredient} disabled={isPending || !recipeIngredientId} style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Recipe Ingredient
        </button>
      </section>

      {/* Create Customer */}
      <section style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
        <h2>👤 Create Customer</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div style={{ gridColumn: '1 / -1', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', marginBottom: '10px', fontSize: '14px' }}>
            ℹ️ Customer ID is automatically generated in Cairo.
          </div>
          <div>
            <label>Faction: </label>
            <select value={customerFaction} onChange={(e) => setCustomerFaction(parseInt(e.target.value) as Faction)} style={{ width: '100%', padding: '5px' }}>
              <option value={Faction.Demon}>Demon</option>
              <option value={Faction.Zombie}>Zombie</option>
              <option value={Faction.Vampire}>Vampire</option>
              <option value={Faction.Ghost}>Ghost</option>
              <option value={Faction.HumanHunter}>HumanHunter</option>
            </select>
          </div>
          <div>
            <label>Reputation Required: </label>
            <input type="number" value={customerRepReq} onChange={(e) => setCustomerRepReq(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div>
            <label>Preferred Recipe ID: </label>
            <input type="text" value={customerPreferredRecipe} onChange={(e) => setCustomerPreferredRecipe(e.target.value)} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <button onClick={handleCreateCustomer} disabled={isPending || !customerPreferredRecipe} style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Create Customer
        </button>
      </section>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', marginTop: '20px' }}>
          Error: {error.message}
        </div>
      )}
      {isPending && (
        <div style={{ padding: '10px', backgroundColor: '#eef', borderRadius: '4px', marginTop: '20px' }}>
          Transaction pending...
        </div>
      )}
    </div>
  );
}

