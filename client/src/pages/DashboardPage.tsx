import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDojoHook, Direction, IngredientType, Faction, CombatEntityType, CraftResultType } from '../hooks/useDojo.ts';
import WalletConnect from '../components/WalletConnect';

export default function DashboardPage({ controller }: { controller: any }) {
  const {
    // Read data
    player,
    position,
    inventory,
    ingredientItems,
    cauldrons,
    potions,
    factionReputations,
    playerProgression,
    combatEntities,
    marketListings,
    zones,
    // Write functions - Core systems
    spawnPlayer,
    movePlayer,
    spawnNode,
    forage,
    startBrew,
    finishBrew,
    sellPotion,
    // Write functions - New systems
    attack,
    craft,
    listItem,
    buyItem,
    cancelListing,
    joinFaction,
    increaseReputation,
    applyFactionBonus,
    addXp,
    tickRegeneration,
    enterZone,
    explore,
    // State
    isConnected,
    isSdkReady,
    isPending,
    error,
    accountAddress,
  } = useDojoHook();

  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'mvp'>('overview');
  const [playerName, setPlayerName] = useState('TestPlayer');
  const [cauldronId, setCauldronId] = useState('999');
  const [recipeId, setRecipeId] = useState('777');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  };

  // Action handlers
  const handleSpawnPlayer = async () => {
    try {
      addLog(`Spawning player: ${playerName}...`);
      await spawnPlayer(playerName);
      addLog(`✅ Player "${playerName}" spawned successfully!`);
    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`);
    }
  };

  const handleMove = async (direction: Direction) => {
    const names = ['Left', 'Right', 'Up', 'Down'];
    try {
      addLog(`Moving ${names[direction]}...`);
      await movePlayer(direction);
      addLog(`✅ Moved ${names[direction]}!`);
    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`);
    }
  };

  const handleSpawnNode = async () => {
    try {
      addLog('Spawning node at (5, 7)...');
      await spawnNode(5, 7, IngredientType.BatWing, 1, 3);
      addLog('✅ Node spawned!');
    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`);
    }
  };

  const handleForage = async () => {
    try {
      addLog('Foraging ingredients...');
      await forage();
      addLog('✅ Foraged successfully!');
    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`);
    }
  };

  const handleStartBrew = async () => {
    try {
      addLog(`Starting brew (cauldron: ${cauldronId}, recipe: ${recipeId})...`);
      await startBrew(cauldronId, recipeId);
      addLog('✅ Brew started!');
    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`);
    }
  };

  const handleFinishBrew = async () => {
    try {
      addLog(`Finishing brew (cauldron: ${cauldronId})...`);
      await finishBrew(cauldronId);
      addLog('✅ Brew finished!');
    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`);
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    margin: '4px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, color: '#1976d2', fontSize: '28px' }}>🎮 Game Dashboard</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <WalletConnect controller={controller} />
            <Link 
              to="/" 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#1976d2', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Game View
            </Link>
            <Link 
              to="/admin" 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#d32f2f', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Admin Panel
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === 'overview' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'overview' ? 'white' : '#333'
            }}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveTab('actions')}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === 'actions' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'actions' ? 'white' : '#333'
            }}
          >
            🎯 Actions
          </button>
          <button 
            onClick={() => setActiveTab('mvp')}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === 'mvp' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'mvp' ? 'white' : '#333'
            }}
          >
            🧪 MVP Test Flow
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Player Stats */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1976d2' }}>👤 Player Stats</h2>
              {player ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><strong>Name:</strong> {player.name || 'N/A'}</div>
                  <div><strong>Health:</strong> {player.health}</div>
                  <div><strong>Stamina:</strong> {player.stamina}</div>
                  <div><strong>Gold:</strong> {player.gold?.toString() || '0'}</div>
                  <div><strong>Reputation:</strong> {player.reputation}</div>
                </div>
              ) : (
                <p style={{ color: '#999' }}>No player data. Spawn a player first.</p>
              )}
            </div>

            {/* Position */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1976d2' }}>📍 Position</h2>
              {position ? (
                <div>
                  <div><strong>X:</strong> {position.x}, <strong>Y:</strong> {position.y}</div>
                  <div><strong>Zone:</strong> {String(position.zone)}</div>
                </div>
              ) : (
                <p style={{ color: '#999' }}>No position data</p>
              )}
            </div>

            {/* Inventory */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1976d2' }}>🎒 Inventory</h2>
              {inventory ? (
                <div>
                  <div><strong>Capacity:</strong> {inventory.capacity}</div>
                  <div><strong>Count:</strong> {inventory.count}</div>
                  <div><strong>Items:</strong> {ingredientItems?.length || 0} ingredients</div>
                </div>
              ) : (
                <p style={{ color: '#999' }}>No inventory data</p>
              )}
              {ingredientItems && ingredientItems.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  {ingredientItems.slice(0, 5).map((item, i) => (
                    <div key={i}>Slot {item.slot}: {IngredientType[item.ingredient_type]} x{item.quantity}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Progression */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1976d2' }}>🏆 Progression</h2>
              {playerProgression ? (
                <div>
                  <div><strong>Level:</strong> {playerProgression.level}</div>
                  <div><strong>XP:</strong> {playerProgression.xp} / {playerProgression.next_level_xp}</div>
                </div>
              ) : (
                <p style={{ color: '#999' }}>No progression data</p>
              )}
            </div>

            {/* Potions */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1976d2' }}>🧪 Potions</h2>
              <div><strong>Count:</strong> {potions?.length || 0}</div>
              {potions && potions.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  {potions.slice(0, 3).map((potion, i) => (
                    <div key={i}>Potion #{potion.potion_id}: Quality {potion.quality}, Value {potion.value?.toString()}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Faction Reputation */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1976d2' }}>🛡️ Faction Reputation</h2>
              {factionReputations && factionReputations.length > 0 ? (
                <div style={{ fontSize: '12px' }}>
                  {factionReputations.map((rep, i) => (
                    <div key={i}>{Faction[rep.faction]}: {rep.reputation}</div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999' }}>No reputation data</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Core Actions */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#4caf50' }}>⚡ Core Actions</h2>
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Player Name:</label>
                  <input 
                    type="text" 
                    value={playerName} 
                    onChange={(e) => setPlayerName(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <button 
                    onClick={handleSpawnPlayer} 
                    disabled={isPending || !isSdkReady}
                    style={{ ...buttonStyle, backgroundColor: '#4caf50', color: 'white', marginTop: '5px', width: '100%' }}
                  >
                    Spawn Player
                  </button>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Movement:</label>
                  <div>
                    <button onClick={() => handleMove(Direction.Left)} disabled={isPending} style={{ ...buttonStyle, backgroundColor: '#2196f3', color: 'white' }}>← Left</button>
                    <button onClick={() => handleMove(Direction.Right)} disabled={isPending} style={{ ...buttonStyle, backgroundColor: '#2196f3', color: 'white' }}>Right →</button>
                    <button onClick={() => handleMove(Direction.Up)} disabled={isPending} style={{ ...buttonStyle, backgroundColor: '#2196f3', color: 'white' }}>↑ Up</button>
                    <button onClick={() => handleMove(Direction.Down)} disabled={isPending} style={{ ...buttonStyle, backgroundColor: '#2196f3', color: 'white' }}>↓ Down</button>
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <button onClick={handleSpawnNode} disabled={isPending} style={{ ...buttonStyle, backgroundColor: '#4caf50', color: 'white', width: '100%' }}>Spawn Node (5,7)</button>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <button onClick={handleForage} disabled={isPending} style={{ ...buttonStyle, backgroundColor: '#4caf50', color: 'white', width: '100%' }}>Forage</button>
                </div>
              </div>
            </div>

            {/* Brewing */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#9c27b0' }}>🧪 Brewing</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Cauldron ID:</label>
                <input 
                  type="text" 
                  value={cauldronId} 
                  onChange={(e) => setCauldronId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Recipe ID:</label>
                <input 
                  type="text" 
                  value={recipeId} 
                  onChange={(e) => setRecipeId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <button onClick={handleStartBrew} disabled={isPending} style={{ ...buttonStyle, backgroundColor: '#9c27b0', color: 'white', width: '100%', marginBottom: '10px' }}>Start Brew</button>
              <button onClick={handleFinishBrew} disabled={isPending} style={{ ...buttonStyle, backgroundColor: '#9c27b0', color: 'white', width: '100%' }}>Finish Brew</button>
            </div>

            {/* New Systems Actions */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#ff9800' }}>⚔️ Combat & Systems</h2>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>New system actions will be available here. See MVP Test Flow tab for complete testing.</p>
            </div>

            {/* Status */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1976d2' }}>📡 Status</h2>
              <div style={{ fontSize: '14px' }}>
                <div><strong>SDK Ready:</strong> {isSdkReady ? '✅' : '❌'}</div>
                <div><strong>Connected:</strong> {isConnected ? '✅' : '❌'}</div>
                <div><strong>Pending:</strong> {isPending ? '⏳' : '✅'}</div>
                {accountAddress && <div style={{ wordBreak: 'break-all', fontSize: '12px', marginTop: '10px' }}><strong>Address:</strong> {accountAddress}</div>}
              </div>
              {error && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', fontSize: '12px' }}>
                  Error: {error.message}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mvp' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* MVP Test Flow */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#9c27b0' }}>🧪 MVP Test Flow</h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                Test the complete MVP flow: Spawn → Move → Node → Forage → Brew
              </p>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Player Name:</label>
                <input 
                  type="text" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Cauldron ID:</label>
                <input 
                  type="text" 
                  value={cauldronId} 
                  onChange={(e) => setCauldronId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Recipe ID:</label>
                <input 
                  type="text" 
                  value={recipeId} 
                  onChange={(e) => setRecipeId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <button 
                onClick={async () => {
                  await handleSpawnPlayer();
                  await new Promise(r => setTimeout(r, 1000));
                  await handleMove(Direction.Right);
                  await new Promise(r => setTimeout(r, 1000));
                  await handleMove(Direction.Right);
                  await new Promise(r => setTimeout(r, 1000));
                  await handleSpawnNode();
                  await new Promise(r => setTimeout(r, 1000));
                  await handleForage();
                  await new Promise(r => setTimeout(r, 1000));
                  await handleStartBrew();
                  await new Promise(r => setTimeout(r, 2000));
                  await handleFinishBrew();
                }}
                disabled={isPending || !isSdkReady}
                style={{ ...buttonStyle, backgroundColor: '#9c27b0', color: 'white', width: '100%', padding: '12px' }}
              >
                🚀 Run Full MVP Flow
              </button>
            </div>

            {/* Logs */}
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1976d2' }}>📋 Activity Logs</h2>
              <div style={{ 
                height: '400px', 
                overflowY: 'auto', 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {logs.length === 0 ? (
                  <p style={{ color: '#999' }}>No logs yet. Start testing to see activity.</p>
                ) : (
                  logs.map((log, i) => <div key={i} style={{ marginBottom: '5px' }}>{log}</div>)
                )}
              </div>
              <button 
                onClick={() => setLogs([])}
                style={{ ...buttonStyle, backgroundColor: '#999', color: 'white', marginTop: '10px', width: '100%' }}
              >
                Clear Logs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

