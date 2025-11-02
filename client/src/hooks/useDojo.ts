import { useMemo, useState, useCallback, useEffect, useContext } from 'react'
import { DojoContext } from '@dojoengine/sdk/react'
import { AccountInterface } from 'starknet'
import { dojoConfig } from '../dojoConfig'
import Controller from '@cartridge/controller'

// Extend Window interface for TypeScript
declare global {
  interface Window {
    cartridgeController?: Controller
  }
}

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
  isSdkReady: boolean
  
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

  const { sdk, account: dojoAccount } = dojoContext
  
  // Get account from Controller if available, otherwise use Dojo context account
  const controller = (typeof window !== 'undefined' && window.cartridgeController) 
    ? window.cartridgeController 
    : null
  
  // State to track controller account changes
  const [controllerAccount, setControllerAccount] = useState(controller?.account || null)
  
  // Update controller account when it changes
  useEffect(() => {
    if (!controller) return
    
    // Check for existing account
    const checkAccount = () => {
      const currentAccount = controller.account || null
      setControllerAccount(prevAccount => {
        if (currentAccount !== prevAccount) {
          // Update SDK account when controller account changes
          if (sdk && currentAccount) {
            sdk.account = currentAccount
            console.log('Updated SDK account from Controller:', currentAccount.address)
          }
          return currentAccount
        }
        return prevAccount
      })
    }
    
    // Initial check
    checkAccount()
    
    // Poll for account changes (Controller doesn't emit events, so we poll)
    const interval = setInterval(checkAccount, 500) // Check every 500ms
    
    // Also listen for custom event from WalletConnect
    const handleAccountChange = () => {
      checkAccount()
    }
    window.addEventListener('controller-account-changed', handleAccountChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('controller-account-changed', handleAccountChange)
    }
  }, [controller, sdk])
  
  const account = controllerAccount || dojoAccount
  
  // Check SDK structure and get execute method
  // SDK might expose execute differently - check multiple possible paths
  const execute = useMemo(() => {
    if (!sdk) {
      console.log('SDK is null')
      return null
    }
    
    // Debug: log full SDK structure first
    console.log('Full SDK structure:', {
      sdkKeys: Object.keys(sdk),
      sdkType: typeof sdk,
      sdkValue: sdk
    })
    
    // Try different possible paths for execute
    if (typeof sdk.execute === 'function') {
      console.log('Found execute at sdk.execute')
      return sdk.execute.bind(sdk)
    }
    if (sdk.client && typeof sdk.client.execute === 'function') {
      console.log('Found execute at sdk.client.execute')
      return sdk.client.execute.bind(sdk.client)
    }
    if (sdk.world && typeof sdk.world.execute === 'function') {
      console.log('Found execute at sdk.world.execute')
      return sdk.world.execute.bind(sdk.world)
    }
    if (sdk.systemCalls && typeof sdk.systemCalls.execute === 'function') {
      console.log('Found execute at sdk.systemCalls.execute')
      return sdk.systemCalls.execute.bind(sdk.systemCalls)
    }
    
    // Check if SDK has a different execution pattern
    // Dojo SDK might use system calls directly
    console.log('SDK structure details:', {
      hasExecute: 'execute' in sdk,
      hasClient: 'client' in sdk,
      hasWorld: 'world' in sdk,
      hasSystemCalls: 'systemCalls' in sdk,
      hasSetup: 'setup' in sdk,
      clientKeys: sdk.client ? Object.keys(sdk.client) : [],
      allKeys: Object.keys(sdk)
    })
    
    return null
  }, [sdk])
  
  // Create a wrapper execute function that uses the SDK's actual execution method
  const executeSystem = useCallback(async (systemName: string, functionName: string, calldata: any[], account: any) => {
    if (!sdk) {
      throw new Error('SDK not initialized')
    }
    
    console.log('executeSystem called:', { systemName, functionName, calldata, hasAccount: !!account })
    
    // Try different execution patterns
    if (execute) {
      console.log('Using execute function')
      try {
        return await execute(systemName, functionName, calldata, account)
      } catch (err) {
        console.error('Execute function failed, trying alternatives:', err)
      }
    }
    
    // Check if SDK has setup.systemCalls (common Dojo pattern)
    if (sdk.setup && sdk.setup.systemCalls) {
      const systemCalls = sdk.setup.systemCalls
      console.log('Found systemCalls in setup:', Object.keys(systemCalls))
      
      // Try to find the system call function
      // System names might be in format: "wc-spawn_system" -> lookup spawn
      const systemKey = systemName.replace('wc-', '').replace('_system', '')
      const callKey = `${systemKey}_${functionName}`
      
      if (typeof systemCalls[callKey] === 'function') {
        console.log(`Using systemCalls.${callKey}`)
        return await systemCalls[callKey]({ account, calldata })
      }
      
      // Try just functionName
      if (typeof systemCalls[functionName] === 'function') {
        console.log(`Using systemCalls.${functionName}`)
        return await systemCalls[functionName]({ account, calldata })
      }
    }
    
    // Alternative: Try direct SDK system calls if available
    if (sdk.systemCalls && typeof sdk.systemCalls[functionName] === 'function') {
      console.log(`Using sdk.systemCalls.${functionName}`)
      const systemCall = sdk.systemCalls[functionName]
      return await systemCall({ account, calldata })
    }
    
    // Try using client.world.execute if available
    if (sdk.client?.world?.execute) {
      console.log('Using sdk.client.world.execute')
      return await sdk.client.world.execute(systemName, functionName, calldata, account)
    }
    
    // Last resort: Try calling through world directly
    if (sdk.world && typeof sdk.world.execute === 'function') {
      console.log('Using sdk.world.execute')
      return await sdk.world.execute(systemName, functionName, calldata)
    }
    
    console.error('No execute method found. SDK structure:', {
      sdkKeys: Object.keys(sdk),
      hasSetup: !!sdk.setup,
      hasSystemCalls: !!sdk.systemCalls,
      hasClient: !!sdk.client,
      hasWorld: !!sdk.world,
      setupKeys: sdk.setup ? Object.keys(sdk.setup) : []
    })
    
    throw new Error(`No execute method found on SDK for ${systemName}::${functionName}. Check console for SDK structure.`)
  }, [sdk, execute])
  
  // Debug: log SDK readiness
  useEffect(() => {
    console.log('SDK Readiness Check:', {
      hasSdk: !!sdk,
      hasExecute: !!execute,
      hasAccount: !!account,
      accountAddress: account?.address,
      controllerAccount: controllerAccount?.address,
      dojoAccount: dojoAccount?.address,
      isSdkReady: !!sdk && !!account, // Simplified - only check SDK and account
      executeType: typeof execute
    })
  }, [sdk, execute, account, controllerAccount, dojoAccount])

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
    if (!account || !accountAddress) {
      throw new Error('Account not connected')
    }
    if (!sdk) {
      throw new Error('SDK not initialized. Please wait for the SDK to load.')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      const nameFelt = stringToFelt(name)
      
      // Execute spawn_player system using the executeSystem wrapper
      // Using system name from manifest: wc-spawn_system
      await executeSystem('wc-spawn_system', 'spawn_player', [nameFelt], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, sdk, executeSystem])

  const movePlayer = useCallback(async (direction: Direction): Promise<void> => {
    if (!account || !accountAddress) {
      throw new Error('Account not connected')
    }
    if (!sdk) {
      throw new Error('SDK not initialized. Please wait for the SDK to load.')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      // Execute move_player system with direction enum value
      await executeSystem('wc-movement_system', 'move_player', [direction], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, sdk, executeSystem])

  const forageAction = useCallback(async (): Promise<void> => {
    if (!account || !accountAddress) {
      throw new Error('Account not connected')
    }
    if (!sdk) {
      throw new Error('SDK not initialized. Please wait for the SDK to load.')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      // Execute forage system (no parameters)
      await executeSystem('wc-forage_system', 'forage', [], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, sdk, executeSystem])

  const startBrew = useCallback(async (cauldronId: string, recipeId: string): Promise<void> => {
    if (!account || !accountAddress) {
      throw new Error('Account not connected')
    }
    if (!sdk) {
      throw new Error('SDK not initialized. Please wait for the SDK to load.')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      const cauldronIdFelt = BigInt(cauldronId)
      const recipeIdFelt = BigInt(recipeId)
      
      // Execute start_brew system
      await executeSystem('wc-brewing_system', 'start_brew', [cauldronIdFelt, recipeIdFelt], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, sdk, executeSystem])

  const finishBrew = useCallback(async (cauldronId: string): Promise<void> => {
    if (!account || !accountAddress) {
      throw new Error('Account not connected')
    }
    if (!sdk) {
      throw new Error('SDK not initialized. Please wait for the SDK to load.')
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      const cauldronIdFelt = BigInt(cauldronId)
      
      // Execute finish_brew system
      await executeSystem('wc-brewing_system', 'finish_brew', [cauldronIdFelt], account)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [account, accountAddress, sdk, executeSystem])

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
    // SDK is ready if we have SDK and account (execute is optional until we actually need it)
    isSdkReady: !!sdk && !!account,
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

