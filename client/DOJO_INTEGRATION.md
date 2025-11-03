# Dojo Integration Guide

This document explains how the frontend is integrated with the Dojo backend on Sepolia.

## Setup

### 1. Configuration

Update `src/dojoConfig.ts` with your deployed world address:

```typescript
export const dojoConfig = {
  worldAddress: "0x...", // Update with your Sepolia world address
  rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  toriiUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  namespace: "witchcraft",
}
```

### 2. Dependencies

All required dependencies are installed:
- `@dojoengine/sdk`: ^1.7.2
- `@dojoengine/core`: 1.7.1
- `@dojoengine/torii-client`: 1.7.2
- `@cartridge/controller`: ^0.10.5
- `starknet`: ^8.5.2

## Architecture

### Core Files

1. **`src/dojoConfig.ts`**: Configuration for Dojo world connection
2. **`src/dojoSetup.ts`**: World setup function
3. **`src/hooks/useDojo.ts`**: Main hook providing:
   - System call functions (spawnPlayer, movePlayer, forage, startBrew, finishBrew)
   - Account connection state
   - Game data (player, position, inventory, etc.)
   - Transaction state (pending, error)

### System Integration

All backend systems are integrated:

#### 1. Spawn System
```typescript
const { spawnPlayer } = useDojoHook()
await spawnPlayer("PlayerName")
```

#### 2. Movement System
```typescript
const { movePlayer } = useDojoHook()
import { Direction } from '../hooks/useDojo'
await movePlayer(Direction.Up) // or Direction.Down, Direction.Left, Direction.Right
```

#### 3. Forage System
```typescript
const { forage } = useDojoHook()
await forage()
```

#### 4. Brewing System
```typescript
const { startBrew, finishBrew } = useDojoHook()
await startBrew(cauldronId, recipeId) // cauldronId and recipeId as string (felt252)
await finishBrew(cauldronId)
```

## Usage Example

### Basic Component Integration

```jsx
import { useDojoHook, Direction } from './hooks/useDojo'

function MyComponent() {
  const {
    isConnected,
    accountAddress,
    spawnPlayer,
    movePlayer,
    player,
    position,
    isPending,
    error,
  } = useDojoHook()

  if (!isConnected) {
    return <div>Please connect your wallet</div>
  }

  return (
    <div>
      {player && <div>Player: {player.name}, Gold: {player.gold}</div>}
      {position && <div>Position: ({position.x}, {position.y})</div>}
      <button onClick={() => movePlayer(Direction.Up)}>Move Up</button>
      {isPending && <div>Transaction pending...</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  )
}
```

## Example Component

See `src/components/DojoConnect.jsx` for a complete example demonstrating:
- Player spawning
- Movement controls
- Foraging
- Brewing system calls

## Data Fetching

The hook uses Torii subscriptions to automatically update game state. Data is fetched from the Dojo world via:

- Torii GraphQL queries for initial data
- Real-time subscriptions for state updates

Currently, the data fetching is structured but may need adjustment based on the actual SDK API. Update the `useEffect` in `useDojo.ts` to implement the specific query methods provided by your SDK version.

## Integration with Existing App.jsx

To integrate with your existing `App.jsx`:

1. Import the hook:
```jsx
import { useDojoHook, Direction } from './hooks/useDojo'
```

2. Use the hook in your component:
```jsx
const dojo = useDojoHook()
```

3. Replace mock functions with Dojo calls:
```jsx
// Instead of: startBrew(recipe, ingredientItems, 'cauldron_1')
await dojo.startBrew(cauldronId, recipeId)
```

4. Sync game state from Dojo data:
```jsx
useEffect(() => {
  if (dojo.player) {
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        gold: Number(dojo.player.gold),
        health: dojo.player.health,
        stamina: dojo.player.stamina,
      }
    }))
  }
}, [dojo.player])
```

## System Names

Systems are called using their namespace-qualified names:
- `wc-spawn_system::spawn_player`
- `wc-movement_system::move_player`
- `wc-forage_system::forage`
- `wc-brewing_system::start_brew`
- `wc-brewing_system::finish_brew`

## Notes

- The world address in `dojoConfig.ts` needs to be updated with your actual deployed Sepolia address
- Account connection is handled by the Dojo SDK provider (configured in `main.jsx`)
- Transaction state (pending/error) is tracked in the hook
- All system calls use proper felt252 encoding for parameters

## Troubleshooting

1. **"Account not connected"**: Ensure wallet is connected through the Dojo SDK provider
2. **"SDK not initialized"**: Check that `DojoSdkProvider` wraps your app in `main.jsx`
3. **Transaction failures**: Verify the world address and network configuration
4. **Data not updating**: Check Torii connection and subscription setup

