import { useState, useEffect } from 'react'
import { useDojoHook } from '../hooks/useDojo.ts'

export default function SpawnPlayerButton() {
  const { spawnPlayer, isConnected, isPending, error, accountAddress, isSdkReady, account } = useDojoHook()
  const [playerName, setPlayerName] = useState('johnn')
  const [success, setSuccess] = useState(false)

  // Debug: log component state
  useEffect(() => {
    console.log('SpawnPlayerButton State:', {
      isConnected,
      isSdkReady,
      accountAddress,
      hasAccount: !!account
    })
  }, [isConnected, isSdkReady, accountAddress, account])

  const handleSpawn = async () => {
    if (!playerName.trim()) {
      alert('Please enter a player name')
      return
    }

    try {
      setSuccess(false)
      await spawnPlayer(playerName)
      setSuccess(true)
      console.log('Player spawned successfully!')
      alert(`Player "${playerName}" spawned successfully!`)
    } catch (err) {
      console.error('Error spawning player:', err)
      alert(`Failed to spawn player: ${err.message || 'Unknown error'}`)
    }
  }

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Please connect your wallet to spawn a player.</p>
        <p>Account: {accountAddress || 'Not connected'}</p>
      </div>
    )
  }

  if (!isSdkReady) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading Dojo SDK...</p>
        <p style={{ fontSize: '12px', color: '#718096' }}>Please wait for the SDK to initialize</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #4a5568', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f7fafc',
      maxWidth: '400px'
    }}>
      <h2 style={{ marginTop: 0, color: '#2d3748' }}>Spawn Player Test</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Player Name:
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter player name"
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #cbd5e0',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          disabled={isPending}
        />
      </div>

      <button
        onClick={handleSpawn}
        disabled={isPending || !playerName.trim() || !isSdkReady}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: isPending ? '#a0aec0' : success ? '#48bb78' : '#4299e1',
          border: 'none',
          borderRadius: '6px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {isPending ? 'Spawning...' : success ? 'Spawned! Spawn Again?' : 'Spawn Player'}
      </button>

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#fed7d7',
          color: '#c53030',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Error: {error.message}
        </div>
      )}

      {success && !isPending && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#c6f6d5',
          color: '#22543d',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          ✅ Player spawned successfully!
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#718096' }}>
        <p>Connected: {accountAddress ? 'Yes' : 'No'}</p>
        {accountAddress && (
          <p style={{ wordBreak: 'break-all' }}>Address: {accountAddress}</p>
        )}
      </div>
    </div>
  )
}

