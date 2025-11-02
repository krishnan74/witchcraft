// Example component demonstrating Dojo connection and player spawning
import { useState } from 'react'
import { useDojoHook, Direction } from '../hooks/useDojo'

export default function DojoConnect() {
  const {
    account,
    isConnected,
    accountAddress,
    spawnPlayer,
    movePlayer,
    forage,
    startBrew,
    finishBrew,
    player,
    position,
    inventory,
    isPending,
    error,
  } = useDojoHook()

  const [playerName, setPlayerName] = useState('')
  const [cauldronId, setCauldronId] = useState('')
  const [recipeId, setRecipeId] = useState('')

  const handleSpawn = async () => {
    if (!playerName.trim()) {
      alert('Please enter a player name')
      return
    }
    try {
      await spawnPlayer(playerName)
      alert('Player spawned successfully!')
    } catch (err) {
      console.error('Error spawning player:', err)
      alert('Failed to spawn player: ' + (err.message || 'Unknown error'))
    }
  }

  const handleMove = async (direction) => {
    try {
      await movePlayer(direction)
      console.log('Player moved successfully!')
    } catch (err) {
      console.error('Error moving player:', err)
      alert('Failed to move: ' + (err.message || 'Unknown error'))
    }
  }

  const handleForage = async () => {
    try {
      await forage()
      alert('Foraged successfully!')
    } catch (err) {
      console.error('Error foraging:', err)
      alert('Failed to forage: ' + (err.message || 'Unknown error'))
    }
  }

  const handleStartBrew = async () => {
    if (!cauldronId || !recipeId) {
      alert('Please enter cauldron ID and recipe ID')
      return
    }
    try {
      await startBrew(cauldronId, recipeId)
      alert('Brewing started!')
    } catch (err) {
      console.error('Error starting brew:', err)
      alert('Failed to start brew: ' + (err.message || 'Unknown error'))
    }
  }

  const handleFinishBrew = async () => {
    if (!cauldronId) {
      alert('Please enter cauldron ID')
      return
    }
    try {
      await finishBrew(cauldronId)
      alert('Brew finished!')
    } catch (err) {
      console.error('Error finishing brew:', err)
      alert('Failed to finish brew: ' + (err.message || 'Unknown error'))
    }
  }

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
        <h2>Dojo Connection</h2>
        <p>Please connect your wallet to interact with the Dojo world.</p>
        <p>Account: {accountAddress || 'Not connected'}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', backgroundColor: '#f9f9f9' }}>
      <h2>Dojo Integration Demo</h2>
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', marginBottom: '10px' }}>
          Error: {error.message}
        </div>
      )}

      {isPending && (
        <div style={{ padding: '10px', backgroundColor: '#eef', marginBottom: '10px' }}>
          Transaction pending...
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Account</h3>
        <p>Address: {accountAddress}</p>
        {player && (
          <div>
            <h4>Player Info</h4>
            <p>Name: {player.name}</p>
            <p>Gold: {player.gold?.toString()}</p>
            <p>Health: {player.health}</p>
            <p>Stamina: {player.stamina}</p>
          </div>
        )}
        {position && (
          <div>
            <h4>Position</h4>
            <p>Location: ({position.x}, {position.y})</p>
            <p>Zone: {position.zone}</p>
          </div>
        )}
        {inventory && (
          <div>
            <h4>Inventory</h4>
            <p>Items: {inventory.count} / {inventory.capacity}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Spawn Player</h3>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter player name"
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={handleSpawn} disabled={isPending}>
          Spawn Player
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Movement</h3>
        <div>
          <button onClick={() => handleMove(Direction.Up)} disabled={isPending}>↑ Up</button>
          <button onClick={() => handleMove(Direction.Down)} disabled={isPending}>↓ Down</button>
          <button onClick={() => handleMove(Direction.Left)} disabled={isPending}>← Left</button>
          <button onClick={() => handleMove(Direction.Right)} disabled={isPending}>→ Right</button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Forage</h3>
        <button onClick={handleForage} disabled={isPending}>
          Forage Ingredients
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Brewing</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={cauldronId}
            onChange={(e) => setCauldronId(e.target.value)}
            placeholder="Cauldron ID (felt)"
            style={{ marginRight: '10px', padding: '5px', width: '200px' }}
          />
          <input
            type="text"
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            placeholder="Recipe ID (felt)"
            style={{ marginRight: '10px', padding: '5px', width: '200px' }}
          />
        </div>
        <div>
          <button onClick={handleStartBrew} disabled={isPending} style={{ marginRight: '10px' }}>
            Start Brew
          </button>
          <button onClick={handleFinishBrew} disabled={isPending}>
            Finish Brew
          </button>
        </div>
      </div>
    </div>
  )
}

