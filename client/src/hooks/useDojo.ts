import { useMemo, useState, useCallback, useEffect, useContext } from 'react'
import { DojoContext } from '@dojoengine/sdk/react'
import { AccountInterface } from 'starknet'
import { dojoConfig } from '../dojoConfig'

// Type definitions matching Cairo models
export interface Player {
  addr: string
  name: string
  gold: bigint
  health: number
  stamina: number
  reputation: number
}

export interface Position {
  owner: string
  x: number
  y: number
  zone: string
}

export interface Inventory {
  owner: string
  capacity: number
  count: number
}

export interface IngredientItem {
  owner: string
  slot: number
  ingredient_type: number
  quantity: number
}

export interface Cauldron {
  owner: string
  cauldron_id: string
  quality: number
  brewing_until: bigint
  recipe_id: string
  busy: boolean
}

export interface Recipe {
  recipe_id: string
  name: string
  effect: number
  difficulty: number
  base_time: bigint
  base_value: bigint
}

export interface Potion {
  potion_id: string
  owner: string
  recipe_id: string
  effect: number
  quality: number
  value: bigint
}

export interface FactionReputation {
  player: string
  faction: number
  reputation: number
}

// Direction enum values (matching Cairo Direction enum)
export enum Direction {
  Left = 0,
  Right = 1,
  Up = 2,
  Down = 3,
}

export interface UseDojoReturn {
  // Connection state
  account: AccountInterface | null
  isConnected: boolean
  accountAddress: string | null
  
  // System functions
  spawnPlayer: (name: string) => Promise<void>
  movePlayer: (direction: Direction) => Promise<void>
  forage: () => Promise<void>
  startBrew: (cauldronId: string, recipeId: string) => Promise<void>
  finishBrew: (cauldronId: string) => Promise<void>
  
  // Transaction state
  isPending: boolean
  error: Error | null
  
  // Data queries (will be populated via Torii subscriptions)
  player: Player | null
  position: Position | null
  inventory: Inventory | null
  ingredientItems: IngredientItem[]
  cauldrons: Cauldron[]
  potions: Potion[]
  factionReputations: FactionReputation[]
  
  // Helper functions
  refreshData: () => Promise<void>
}

// Helper function to convert string to felt252
function stringToFelt(str: string): bigint {
  // SNIP-12 encoding for short strings
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  if (bytes.length > 31) {
    throw new Error('String too long for felt252')
  }
  let felt = BigInt(0)
  for (let i = 0; i < bytes.length; i++) {
    felt = felt * BigInt(256) + BigInt(bytes[i])
  }
  return felt
}

export function useDojoHook(): UseDojoReturn {
  const dojoContext = useContext(DojoContext)
  
  if (!dojoContext) {
    throw new Error('useDojoHook must be used within DojoSdkProvider')
  }

  const { sdk, account } = dojoContext
  const execute = sdk?.execute.bind(sdk)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Data state (will be updated via Torii subscriptions)
  const [player, setPlayer] = useState<Player | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [ingredientItems, setIngredientItems] = useState<IngredientItem[]>([])
  const [cauldrons, setCauldrons] = useState<Cauldron[]>([])
  const [potions, setPotions] = useState<Potion[]>([])
  const [factionReputations, setFactionReputations] = useState<FactionReputation[]>([])

  const accountAddress = account?.address || null
  const isConnected = !!account && !!accountAddress

  // System call functions using execute method
  // System names: wc-spawn_system, wc-movement_system, wc-forage_system, wc-brewing_system
  const spawnPlayer = useCallback(async (name: string): Promise<void> => {
    if (!account || !accountAddress || !execute) {
      throw new Error('Account not connected or SDK not initialized')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      const nameFelt = stringToFelt(name)
      
      // Execute spawn_player system
      // Using system name from manifest: wc-spawn_system
      await execute('wc-spawn_system', 'spawn_player', [nameFelt], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, execute])

  const movePlayer = useCallback(async (direction: Direction): Promise<void> => {
    if (!account || !accountAddress || !execute) {
      throw new Error('Account not connected or SDK not initialized')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      // Execute move_player system with direction enum value
      await execute('wc-movement_system', 'move_player', [direction], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, execute])

  const forageAction = useCallback(async (): Promise<void> => {
    if (!account || !accountAddress || !execute) {
      throw new Error('Account not connected or SDK not initialized')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      // Execute forage system (no parameters)
      await execute('wc-forage_system', 'forage', [], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, execute])

  const startBrew = useCallback(async (cauldronId: string, recipeId: string): Promise<void> => {
    if (!account || !accountAddress || !execute) {
      throw new Error('Account not connected or SDK not initialized')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      const cauldronIdFelt = BigInt(cauldronId)
      const recipeIdFelt = BigInt(recipeId)
      
      // Execute start_brew system
      await execute('wc-brewing_system', 'start_brew', [cauldronIdFelt, recipeIdFelt], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, execute])

  const finishBrew = useCallback(async (cauldronId: string): Promise<void> => {
    if (!account || !accountAddress || !execute) {
      throw new Error('Account not connected or SDK not initialized')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      const cauldronIdFelt = BigInt(cauldronId)
      
      // Execute finish_brew system
      await execute('wc-brewing_system', 'finish_brew', [cauldronIdFelt], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, execute])

  // Fetch data from Torii using SDK's query capabilities
  useEffect(() => {
    if (!sdk || !accountAddress) return

    const fetchData = async () => {
      try {
        // The SDK should provide query methods via Torii
        // This is a placeholder - actual implementation depends on SDK API
        // You may need to use sdk.torii or similar to query entities
        
        // Example query structure (adjust based on actual SDK API):
        // const playerData = await sdk.query('Player', accountAddress)
        // setPlayer(playerData)
      } catch (err) {
        console.error('Error fetching data from Torii:', err)
      }
    }

    fetchData()
    
    // Set up subscriptions for real-time updates
    // The SDK should handle this automatically, but you may need to configure it
  }, [sdk, accountAddress])

  const refreshData = useCallback(async () => {
    // Force refresh by re-fetching from Torii
    // The SDK should handle this automatically via subscriptions
    // This is a placeholder for manual refresh if needed
    if (!sdk || !accountAddress) return
    
    try {
      // Trigger a re-fetch of all data
      // Implementation depends on SDK's actual query API
      console.log('Refreshing data from Torii...')
    } catch (err) {
      console.error('Error refreshing data:', err)
    }
  }, [sdk, accountAddress])

  return {
    account: account || null,
    isConnected,
    accountAddress,
    spawnPlayer,
    movePlayer,
    forage: forageAction,
    startBrew,
    finishBrew,
    isPending,
    error,
    player,
    position,
    inventory,
    ingredientItems,
    cauldrons,
    potions,
    factionReputations,
    refreshData,
  }
}

