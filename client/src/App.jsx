import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import GameCanvas from './components/GameCanvas'
import InventoryPopup from './components/InventoryPopup'
import RecipeBookPopup from './components/RecipeBookPopup'
import CauldronPopup from './components/CauldronPopup'
import ShopPopup from './components/ShopPopup'
import NightBeginsPopup from './components/NightBeginsPopup'
import SpawnPlayerButton from './components/SpawnPlayerButton'
import WalletConnect from './components/WalletConnect'
import DashboardPage from './pages/DashboardPage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import { initializeCycle, updateCycle, getTimeRemaining } from './utils/dayNightCycle'
import { generateCustomerOrders } from './utils/shopSystem'
import { GameEngine } from './engine/GameEngine'
import { SceneManager } from './engine/SceneManager'
import { ShopScene } from './scenes/ShopScene'
import { ExplorationScene } from './scenes/ExplorationScene'
import { useDojoHook } from './hooks/useDojo.ts'
import './App.css'

function App({ controller }) {
  // Get real data and functions from Dojo
  const {
    player,
    position,
    inventory,
    ingredientItems,
    potions,
    factionReputations,
    playerProgression,
    startBrew: dojoStartBrew,
    finishBrew: dojoFinishBrew,
    sellPotion: dojoSellPotion,
    refreshData,
    isSdkReady,
    isPending,
    error: dojoError,
  } = useDojoHook()

  const canvasRef = useRef(null)
  const gameEngineRef = useRef(null)
  const sceneManagerRef = useRef(null)
  
  // Convert factionReputations array to object format for easier access
  const factionReputationObj = factionReputations.reduce((acc, rep) => {
    const factionName = ['Demon', 'Zombie', 'Vampire', 'Ghost', 'HumanHunter'][rep.faction] || 'Unknown'
    acc[factionName] = rep.reputation
    return acc
  }, {})

  // Game state aligned with Dojo models - using real data
  const gameStateRef = useRef({
    // Player model (from Dojo)
    player: player || {
      addr: null,
      name: '',
      gold: BigInt(0),
      health: 0,
      stamina: 0,
      reputation: 0
    },
    // WorldState model (client-side for now, can be extended with Dojo WorldState if available)
    worldState: {
      id: 'world_1',
      day: 1,
      time_of_day: 'Day',
      moon_phase: 'New',
      human_alert_level: 0
    },
    // Inventory model (from Dojo)
    inventory: inventory || {
      owner: null,
      capacity: 0,
      count: 0
    },
    // IngredientItem array (from Dojo)
    ingredientItems: ingredientItems || [],
    // Potion array (from Dojo)
    potions: potions || [],
    // Orders (client-side generated for now, can be extended with Dojo Order model)
    orders: [],
    // FactionReputation (from Dojo)
    factionReputation: {
      Demon: factionReputationObj.Demon || 0,
      Zombie: factionReputationObj.Zombie || 0,
      Vampire: factionReputationObj.Vampire || 0,
      Ghost: factionReputationObj.Ghost || 0,
      HumanHunter: factionReputationObj.HumanHunter || 0
    },
    // Position (from Dojo)
    position: position || {
      owner: null,
      x: 640,
      y: 360,
      zone: 'Forest'
    }
  })
  
  const [gameState, setGameState] = useState(gameStateRef.current)
  
  // Sync game state when Dojo data changes
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      player: player || prev.player,
      inventory: inventory || prev.inventory,
      ingredientItems: ingredientItems || prev.ingredientItems,
      potions: potions || prev.potions,
      position: position || prev.position,
      factionReputation: {
        Demon: factionReputationObj.Demon || prev.factionReputation.Demon,
        Zombie: factionReputationObj.Zombie || prev.factionReputation.Zombie,
        Vampire: factionReputationObj.Vampire || prev.factionReputation.Vampire,
        Ghost: factionReputationObj.Ghost || prev.factionReputation.Ghost,
        HumanHunter: factionReputationObj.HumanHunter || prev.factionReputation.HumanHunter
      }
    }))
  }, [player, inventory, ingredientItems, potions, position, factionReputations])
  const [showInventory, setShowInventory] = useState(false)
  const [showRecipeBook, setShowRecipeBook] = useState(false)
  const [showCauldron, setShowCauldron] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [showNightBegins, setShowNightBegins] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120000) // Initialize with day duration
  const explorationSceneRef = useRef(null)
  const dayNightCycleRef = useRef(initializeCycle())

  // Update ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size (larger viewport)
    canvas.width = 1920
    canvas.height = 1080

    // Initialize game engine
    const engine = new GameEngine(canvas, ctx)
    gameEngineRef.current = engine

    // Initialize scene manager
    const sceneManager = new SceneManager(engine)
    sceneManagerRef.current = sceneManager
    
    // Helper function to get current state
    const getGameState = () => gameStateRef.current
    
    // Register scenes
    sceneManager.registerScene('shop', new ShopScene(engine, sceneManager, gameStateRef.current, setGameState))
    
    // Create exploration scene and store reference
    const explorationScene = new ExplorationScene(engine, sceneManager, gameStateRef.current, setGameState)
    explorationSceneRef.current = explorationScene
    
    // Set up interaction callbacks
    explorationScene.onRecipeBookInteract = () => {
      setShowRecipeBook(true)
    }
    
    explorationScene.onCauldronInteract = () => {
      setShowCauldron(true)
    }
    
    explorationScene.onShopInteract = () => {
      // Only show shop popup during night
      if (gameStateRef.current.worldState.time_of_day === 'Night') {
        setShowShop(true)
      } else {
        console.log('Shop is only open during night time!')
      }
    }
    
    sceneManager.registerScene('exploration', explorationScene)
    
    // Start with exploration scene (day time)
    sceneManager.changeScene('exploration')

    // Game loop
    let animationFrameId
    const gameLoop = (timestamp) => {
      engine.update(timestamp)
      engine.render()
      
      // Update and render current scene
      sceneManager.update(engine.deltaTime)
      sceneManager.render(ctx)
      
      animationFrameId = requestAnimationFrame(gameLoop)
    }
    
    animationFrameId = requestAnimationFrame(gameLoop)

    // Handle inventory toggle (I key)
    const handleKeyDown = (e) => {
      if (e.code === 'KeyI') {
        e.preventDefault()
        setShowInventory(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Day/Night Cycle Timer
    const cycleInterval = setInterval(() => {
      const cycleState = updateCycle(dayNightCycleRef.current)
      dayNightCycleRef.current = cycleState

      if (cycleState.phaseChanged) {
        const newTimeOfDay = cycleState.currentPhase
        
        setGameState(prev => {
          const updatedState = {
            ...prev,
            worldState: {
              ...prev.worldState,
              time_of_day: newTimeOfDay
            }
          }

          // When night starts, generate customer orders and show notification
          if (newTimeOfDay === 'Night') {
            const orders = generateCustomerOrders(prev.worldState.day, 1, 5)
            updatedState.orders = orders
            console.log(`🌙 Night begins! Generated ${orders.length} customer orders`)
            // Show night begins popup
            setShowNightBegins(true)
          }

          // When night ends, advance to next day
          if (cycleState.shouldAdvanceDay) {
            const newDay = ((prev.worldState.day % 7) + 1) // Cycle 1-7
            updatedState.worldState.day = newDay
            updatedState.orders = [] // Clear orders for new day
            console.log(`🌅 Day ${newDay} begins!`)
            
            // Notify exploration scene to update ingredients for new day
            if (explorationSceneRef.current && explorationSceneRef.current.onDayChange) {
              explorationSceneRef.current.onDayChange(newDay)
            }
          }

          // Propagate updated game state to the active exploration scene and refresh background
          if (explorationSceneRef.current) {
            explorationSceneRef.current.gameState = updatedState
            if (typeof explorationSceneRef.current.updateBackgroundImage === 'function') {
              explorationSceneRef.current.updateBackgroundImage()
            }
          }

          return updatedState
        })

        // Stay in exploration scene - player can walk to shop building
        // Only switch to shop scene if we're not already in exploration
        if (newTimeOfDay === 'Day') {
          // Day time - make sure we're in exploration mode
          if (sceneManager.currentScene !== 'exploration') {
            sceneManager.changeScene('exploration')
          }
          setShowShop(false) // Close shop popup during day
        }
        // During night, stay in exploration scene so player can walk to shop
      }
    }, 100) // Check every 100ms

    // Live timer update - updates every second for UI display
    const timerInterval = setInterval(() => {
      const remaining = getTimeRemaining(dayNightCycleRef.current)
      setTimeRemaining(remaining)
    }, 1000) // Update every second

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      clearInterval(cycleInterval)
      clearInterval(timerInterval)
      window.removeEventListener('keydown', handleKeyDown)
      engine.cleanup()
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Game View Route */}
        <Route path="/" element={
          <div className="app">
            {/* Wallet Connection */}
            <div style={{ position: 'fixed', top: '20px', left: '1500px', zIndex: 1000, maxWidth: '350px' }}>
              <WalletConnect controller={controller} />
            </div>

            {/* Navigation Links */}
            

            {/* Dojo Integration Test Button */}
           

            <div className="game-container">
              <GameCanvas ref={canvasRef} />
              <div className="ui-overlay">
                <div className="stats-bar">
                  <div className="stat">Day: {gameState.worldState.day}</div>
                  <div className="stat">Time: {gameState.worldState.time_of_day}</div>
                  <div className="stat">
                    {gameState.worldState.time_of_day === 'Night' 
                      ? `Night: ${Math.ceil(timeRemaining / 1000)}s`
                      : `Day: ${Math.ceil(timeRemaining / 1000)}s`}
                  </div>
                  <div className="stat">Gold: {typeof gameState.player.gold === 'bigint' ? gameState.player.gold.toString() : gameState.player.gold}</div>
                  <div className="stat">Health: {gameState.player.health}</div>
                  <div className="stat">Stamina: {gameState.player.stamina || 0}</div>
                  {dojoError && (
                    <div className="stat" style={{ color: 'red', fontSize: '12px' }}>
                      Error: {dojoError.message}
                    </div>
                  )}
                  {isPending && (
                    <div className="stat" style={{ color: 'yellow', fontSize: '12px' }}>
                      Processing...
                    </div>
                  )}
                  {!isSdkReady && (
                    <div className="stat" style={{ color: 'orange', fontSize: '12px' }}>
                      SDK Loading...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Popup */}
            <InventoryPopup
              isOpen={showInventory}
              onClose={() => setShowInventory(false)}
              inventory={gameState.inventory}
              ingredientItems={gameState.ingredientItems}
              potions={gameState.potions}
              player={gameState.player}
            />

            {/* Recipe Book Popup */}
            <RecipeBookPopup
              isOpen={showRecipeBook}
              onClose={() => setShowRecipeBook(false)}
              currentDay={gameState.worldState.day}
            />

            {/* Cauldron Popup */}
            <CauldronPopup
              isOpen={showCauldron}
              onClose={() => setShowCauldron(false)}
              currentDay={gameState.worldState.day}
              ingredientItems={gameState.ingredientItems}
              onStartBrew={async (recipe) => {
                // Use real Dojo brewing function
                try {
                  // Get first available cauldron (or use a default one)
                  const cauldronId = '1' // Default cauldron ID - can be improved to select from available cauldrons
                  const recipeId = String(recipe.recipe_id || recipe.id || '1')
                  
                  console.log(`Starting brew with cauldron ${cauldronId} and recipe ${recipeId}`)
                  
                  // Start brewing via Dojo
                  await dojoStartBrew(cauldronId, recipeId)
                  
                  // Refresh data to get updated inventory
                  await refreshData()
                  
                  // Note: In a real Dojo implementation, you would need to poll or subscribe
                  // to check when brewing is complete. For now, we'll use a timeout based on recipe base_time
                  // In production, you'd check the cauldron's brewing_until field against current block number
                  const brewingTime = recipe.base_time ? Number(recipe.base_time) * 1000 : 5000
                  
                  setTimeout(async () => {
                    try {
                      // Finish brewing via Dojo
                      await dojoFinishBrew(cauldronId)
                      
                      // Refresh data to get the new potion
                      await refreshData()
                      
                      console.log(`✅ Potion brewing completed!`)
                      
                      // Close cauldron popup after brewing completes
                      setShowCauldron(false)
                    } catch (error) {
                      console.error('Error finishing brew:', error)
                      alert(`Failed to finish brewing: ${error instanceof Error ? error.message : String(error)}`)
                    }
                  }, brewingTime)
                } catch (error) {
                  console.error('Error starting brew:', error)
                  alert(`Failed to start brewing: ${error instanceof Error ? error.message : String(error)}`)
                }
              }}
            />

            {/* Shop Popup (opens during night time) */}
            <ShopPopup
              isOpen={showShop && gameState.worldState.time_of_day === 'Night'}
              onClose={() => setShowShop(false)}
              currentDay={gameState.worldState.day}
              orders={gameState.orders}
              potions={gameState.potions}
              timeRemaining={timeRemaining}
              onSellPotion={async (result) => {
                // Use real Dojo sell function
                try {
                  const potionId = result.potion.potion_id || result.potion.id || String(result.potion.potionId)
                  
                  console.log(`Selling potion ${potionId}`)
                  
                  // Sell potion via Dojo
                  await dojoSellPotion(potionId)
                  
                  // Refresh data to get updated gold and potion inventory
                  await refreshData()
                  
                  // Update local orders if we have order tracking
                  if (result.orderId) {
                    setGameState(prev => ({
                      ...prev,
                      orders: prev.orders.map(order => 
                        order.order_id === result.orderId
                          ? { ...order, fulfilled: true }
                          : order
                      )
                    }))
                  }
                  
                  console.log(`💰 Potion sold successfully!`)
                } catch (error) {
                  console.error('Error selling potion:', error)
                  alert(`Failed to sell potion: ${error instanceof Error ? error.message : String(error)}`)
                }
              }}
            />

            {/* Night Begins Popup (auto-shows when night starts) */}
            <NightBeginsPopup
              isOpen={showNightBegins}
              onClose={() => setShowNightBegins(false)}
              currentDay={gameState.worldState.day}
            />
          </div>
        } />

        {/* Dashboard Route */}
        <Route path="/dashboard" element={<DashboardPage controller={controller} />} />

        {/* Admin Route */}
        <Route path="/admin" element={<AdminPage controller={controller} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

