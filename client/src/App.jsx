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
import { startBrew, finishBrew } from './utils/brewingSystem'
import { initializeCycle, updateCycle, getTimeRemaining } from './utils/dayNightCycle'
import { generateCustomerOrders } from './utils/shopSystem'
import { GameEngine } from './engine/GameEngine'
import { SceneManager } from './engine/SceneManager'
import { ShopScene } from './scenes/ShopScene'
import { ExplorationScene } from './scenes/ExplorationScene'
import './App.css'

function App({ controller }) {
  const canvasRef = useRef(null)
  const gameEngineRef = useRef(null)
  const sceneManagerRef = useRef(null)
  // Game state aligned with Dojo models
  const gameStateRef = useRef({
    // Player model
    player: {
      addr: null, // ContractAddress - will be set when connected
      name: '', // felt252
      gold: 100, // u128
      health: 100, // u16
      stamina: 100, // u16
      reputation: 0 // i32
    },
    // WorldState model
    worldState: {
      id: 'world_1', // felt252
      day: 1, // u8
      time_of_day: 'Day', // TimeOfDay enum - starts in Day
      moon_phase: 'New', // MoonPhase enum
      human_alert_level: 0 // u8
    },
    // Inventory model
    inventory: {
      owner: null, // ContractAddress
      capacity: 20, // u16
      count: 0 // u16
    },
    // IngredientItem array (from Dojo)
    ingredientItems: [], // Array of { owner, slot, ingredient_type, quantity }
    // Potion array (from Dojo)
    potions: [], // Array of { potion_id, owner, recipe_id, effect, quality, value }
    // Orders (from Dojo Order model)
    orders: [], // Array of { order_id, buyer_id, recipe_id, price, deadline_epoch, fulfilled, faction }
    // FactionReputation (from Dojo)
    factionReputation: {
      Demon: 50, // i32
      Zombie: 50, // i32
      Vampire: 50, // i32
      Ghost: 50, // i32
      HumanHunter: 0 // i32
    },
    // Position (from Dojo)
    position: {
      entity: null, // ContractAddress
      x: 640, // u32
      y: 360, // u32
      zone: 'Forest' // ZoneType enum
    }
  })
  
  const [gameState, setGameState] = useState(gameStateRef.current)
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
            <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000, maxWidth: '350px' }}>
              <WalletConnect controller={controller} />
            </div>

            {/* Navigation Links */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
              <Link 
                to="/dashboard" 
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#4caf50', 
                  color: 'white', 
                  textDecoration: 'none', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Dashboard
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
                Admin
              </Link>
            </div>

            {/* Dojo Integration Test Button */}
            <div style={{ position: 'fixed', top: '60px', right: '20px', zIndex: 1000 }}>
              <SpawnPlayerButton />
            </div>

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
                  <div className="stat">Gold: {gameState.player.gold}</div>
                  <div className="stat">Health: {gameState.player.health}</div>
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
              onStartBrew={(recipe) => {
                // Handle brewing - consume ingredients and create potion
                // TODO: Replace with Dojo calls when integrated
                // Dojo: await brewingSystem.start_brew(cauldron_id, recipe_id)
                
                // Check and start brewing (matches Dojo start_brew logic)
                const brewResult = startBrew(recipe, gameState.ingredientItems, 'cauldron_1')
                
                if (brewResult.success) {
                  // Update inventory with consumed ingredients
                  setGameState(prev => ({
                    ...prev,
                    ingredientItems: brewResult.updatedItems,
                    inventory: {
                      ...prev.inventory,
                      count: brewResult.updatedItems.reduce((sum, item) => sum + item.quantity, 0)
                    }
                  }))
                  
                  // Simulate brewing time and create potion
                  // TODO: In Dojo, this will check block_number >= brewing_until
                  setTimeout(() => {
                    // Dojo: await brewingSystem.finish_brew(cauldron_id)
                    const finishResult = finishBrew(recipe, 1) // cauldronQuality = 1 for now
                    
                    if (finishResult.success) {
                      // Add potion to inventory (matches Dojo potion creation)
                      setGameState(prev => ({
                        ...prev,
                        potions: [...(prev.potions || []), finishResult.potion],
                        player: {
                          ...prev.player,
                          gold: prev.player.gold + finishResult.goldEarned
                        }
                      }))
                      
                      console.log(`✅ Potion brewed: ${finishResult.potion.effect} (Quality: ${finishResult.potion.quality})`)
                      
                      // Close cauldron popup after brewing completes
                      setShowCauldron(false)
                    }
                  }, recipe.base_time * 1000)
                } else {
                  console.warn('Brewing failed:', brewResult.error)
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
              onSellPotion={(result) => {
                // Handle potion sale
                // TODO: Replace with Dojo calls when integrated
                // Dojo: await shopSystem.fulfill_order(order_id, potion_id)
                
                if (result.success) {
                  setGameState(prev => {
                    // Remove sold potion from inventory
                    const updatedPotions = prev.potions.filter(
                      p => p.potion_id !== result.potion.potion_id
                    )
                    
                    // Mark order as fulfilled
                    const updatedOrders = prev.orders.map(order => 
                      order.order_id === result.orderId
                        ? { ...order, fulfilled: true }
                        : order
                    )
                    
                    // Add gold
                    return {
                      ...prev,
                      potions: updatedPotions,
                      orders: updatedOrders,
                      player: {
                        ...prev.player,
                        gold: prev.player.gold + result.goldEarned
                      }
                    }
                  })
                  
                  console.log(`💰 Sold potion for ${result.goldEarned} gold!`)
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

