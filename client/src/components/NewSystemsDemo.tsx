import  React, { useState } from 'react';
import { useDojoHook, Faction, CombatEntityType } from '../hooks/useDojo.ts';

/**
 * Example component demonstrating how to use the new integrated systems
 * This shows all the new system functions available in useDojoHook
 */
export default function NewSystemsDemo() {
  const {
    // Combat System
    attack,
    // Crafting System
    craft,
    // Economy System
    listItem,
    buyItem,
    cancelListing,
    // Faction System
    joinFaction,
    increaseReputation,
    applyFactionBonus,
    // Progression System
    addXp,
    getLevel,
    // Resource Regeneration
    tickRegeneration,
    // Zone System
    enterZone,
    explore,
    // Sell System (already existed, but documented here)
    sellPotion,
    // State
    isPending,
    error,
    isSdkReady,
    accountAddress,
    playerProgression,
    factionReputations,
    combatEntities,
    marketListings,
    zones,
  } = useDojoHook();

  const [targetId, setTargetId] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [itemSlot, setItemSlot] = useState(0);
  const [itemPrice, setItemPrice] = useState('');
  const [listingId, setListingId] = useState('');
  const [zoneId, setZoneId] = useState(0);
  const [selectedFaction, setSelectedFaction] = useState<Faction>(Faction.Demon);
  const [reputationAmount, setReputationAmount] = useState(1);
  const [xpAmount, setXpAmount] = useState(10);

  const handleAttack = async () => {
    if (!targetId) {
      alert('Please enter a target ID');
      return;
    }
    try {
      await attack(targetId);
      alert('Attack executed!');
    } catch (err: any) {
      alert(`Attack failed: ${err.message}`);
    }
  };

  const handleCraft = async () => {
    if (!recipeId) {
      alert('Please enter a recipe ID');
      return;
    }
    try {
      await craft(recipeId);
      alert('Crafting initiated!');
    } catch (err: any) {
      alert(`Crafting failed: ${err.message}`);
    }
  };

  const handleListItem = async () => {
    if (!itemPrice) {
      alert('Please enter a price');
      return;
    }
    try {
      const price = BigInt(itemPrice);
      await listItem(itemSlot, price);
      alert('Item listed on marketplace!');
    } catch (err: any) {
      alert(`Listing failed: ${err.message}`);
    }
  };

  const handleBuyItem = async () => {
    if (!listingId) {
      alert('Please enter a listing ID');
      return;
    }
    try {
      await buyItem(listingId);
      alert('Item purchased!');
    } catch (err: any) {
      alert(`Purchase failed: ${err.message}`);
    }
  };

  const handleCancelListing = async () => {
    if (!listingId) {
      alert('Please enter a listing ID');
      return;
    }
    try {
      await cancelListing(listingId);
      alert('Listing cancelled!');
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const handleJoinFaction = async () => {
    try {
      await joinFaction(selectedFaction);
      alert(`Joined faction: ${Faction[selectedFaction]}!`);
    } catch (err: any) {
      alert(`Failed to join faction: ${err.message}`);
    }
  };

  const handleIncreaseReputation = async () => {
    try {
      await increaseReputation(selectedFaction, reputationAmount);
      alert(`Reputation increased by ${reputationAmount}!`);
    } catch (err: any) {
      alert(`Failed to increase reputation: ${err.message}`);
    }
  };

  const handleApplyFactionBonus = async () => {
    if (!accountAddress) {
      alert('Please connect your wallet');
      return;
    }
    try {
      await applyFactionBonus(accountAddress);
      alert('Faction bonus applied!');
    } catch (err: any) {
      alert(`Failed to apply bonus: ${err.message}`);
    }
  };

  const handleAddXp = async () => {
    try {
      await addXp(xpAmount);
      alert(`Added ${xpAmount} XP!`);
    } catch (err: any) {
      alert(`Failed to add XP: ${err.message}`);
    }
  };

  const handleTickRegeneration = async () => {
    try {
      await tickRegeneration();
      alert('Resource regeneration tick executed!');
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message}`);
    }
  };

  const handleEnterZone = async () => {
    try {
      await enterZone(zoneId);
      alert(`Entered zone ${zoneId}!`);
    } catch (err: any) {
      alert(`Failed to enter zone: ${err.message}`);
    }
  };

  const handleExplore = async () => {
    try {
      await explore();
      alert('Exploration completed!');
    } catch (err: any) {
      alert(`Exploration failed: ${err.message}`);
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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>New Systems Integration Demo</h1>

      {/* Combat System */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>⚔️ Combat System</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Target ID (felt252): </label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Enter target ID"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <button onClick={handleAttack} disabled={isPending || !targetId}>
          Attack Target
        </button>
      </section>

      {/* Crafting System */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>🧙 Crafting System</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Recipe ID (felt252): </label>
          <input
            type="text"
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            placeholder="Enter recipe ID"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <button onClick={handleCraft} disabled={isPending || !recipeId}>
          Craft Item
        </button>
      </section>

      {/* Economy System */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>💰 Economy System</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Item Slot: </label>
          <input
            type="number"
            value={itemSlot}
            onChange={(e) => setItemSlot(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Price (u128): </label>
          <input
            type="text"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            placeholder="Enter price"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleListItem} disabled={isPending || !itemPrice}>
            List Item
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Listing ID: </label>
          <input
            type="text"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="Enter listing ID"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleBuyItem} disabled={isPending || !listingId}>
            Buy Item
          </button>
          <button
            onClick={handleCancelListing}
            disabled={isPending || !listingId}
            style={{ marginLeft: '10px' }}
          >
            Cancel Listing
          </button>
        </div>
      </section>

      {/* Faction System */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>🛡️ Faction System</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Faction: </label>
          <select
            value={selectedFaction}
            onChange={(e) => setSelectedFaction(parseInt(e.target.value) as Faction)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value={Faction.Demon}>Demon</option>
            <option value={Faction.Zombie}>Zombie</option>
            <option value={Faction.Vampire}>Vampire</option>
            <option value={Faction.Ghost}>Ghost</option>
            <option value={Faction.HumanHunter}>HumanHunter</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleJoinFaction} disabled={isPending}>
            Join Faction
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Reputation Amount: </label>
          <input
            type="number"
            value={reputationAmount}
            onChange={(e) => setReputationAmount(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
          />
          <button
            onClick={handleIncreaseReputation}
            disabled={isPending}
            style={{ marginLeft: '10px' }}
          >
            Increase Reputation
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleApplyFactionBonus} disabled={isPending || !accountAddress}>
            Apply Faction Bonus
          </button>
        </div>
      </section>

      {/* Progression System */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>🏆 Progression System</h2>
        {playerProgression && (
          <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <p><strong>Level:</strong> {playerProgression.level}</p>
            <p><strong>XP:</strong> {playerProgression.xp} / {playerProgression.next_level_xp}</p>
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <label>XP Amount: </label>
          <input
            type="number"
            value={xpAmount}
            onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
          />
          <button onClick={handleAddXp} disabled={isPending} style={{ marginLeft: '10px' }}>
            Add XP
          </button>
        </div>
      </section>

      {/* Zone System */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>🏰 Zone System</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Zone ID: </label>
          <input
            type="number"
            value={zoneId}
            onChange={(e) => setZoneId(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
          />
          <button onClick={handleEnterZone} disabled={isPending} style={{ marginLeft: '10px' }}>
            Enter Zone
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleExplore} disabled={isPending}>
            Explore Current Zone
          </button>
        </div>
      </section>

      {/* Resource Regeneration */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>⛏️ Resource Regeneration</h2>
        <button onClick={handleTickRegeneration} disabled={isPending}>
          Tick Regeneration
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Note: This is typically called by admin/keeper, not players
        </p>
      </section>

      {/* Status Display */}
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

