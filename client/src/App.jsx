import { useEffect, useRef, useState } from 'react'
import GameCanvas from './components/GameCanvas'
import { GameEngine } from './engine/GameEngine'
import { SceneManager } from './engine/SceneManager'
import { ShopScene } from './scenes/ShopScene'
import { ExplorationScene } from './scenes/ExplorationScene'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  const gameEngineRef = useRef(null)
  const sceneManagerRef = useRef(null)
  const gameStateRef = useRef({
    day: 1,
    time: 'day', // 'day' | 'night'
    gold: 100,
    ingredients: {},
    potions: {},
    reputation: {
      demons: 50,
      zombies: 50,
      vampires: 50
    }
  })
  
  const [gameState, setGameState] = useState(gameStateRef.current)

  // Update ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    canvas.width = 1280
    canvas.height = 720

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
    sceneManager.registerScene('exploration', new ExplorationScene(engine, sceneManager, gameStateRef.current, setGameState))
    
    // Start with shop scene (day mode)
    sceneManager.changeScene('shop')

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

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      engine.cleanup()
    }
  }, [])

  return (
    <div className="app">
      <div className="game-container">
        <GameCanvas ref={canvasRef} />
        <div className="ui-overlay">
          <div className="stats-bar">
            <div className="stat">Day: {gameState.day}</div>
            <div className="stat">Time: {gameState.time}</div>
            <div className="stat">Gold: {gameState.gold}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

