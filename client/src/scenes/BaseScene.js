import { spriteManager } from '../engine/SpriteManager'

/**
 * Base Scene class that all game scenes extend
 */
export class BaseScene {
  constructor(gameEngine, sceneManager, gameState, setGameState) {
    this.gameEngine = gameEngine
    this.sceneManager = sceneManager
    this.gameState = gameState
    this.setGameState = setGameState
    this.entities = []
    this.initialized = false
  }

  onEnter() {
    // Override in subclasses
  }

  onExit() {
    // Override in subclasses
    this.entities = []
  }

  update(deltaTime) {
    // Update all entities
    this.entities.forEach(entity => {
      if (entity.active) {
        entity.update(deltaTime)
      }
    })

    // Remove inactive entities
    this.entities = this.entities.filter(entity => entity.active)
  }

  render(ctx) {
    // Render all entities
    this.entities.forEach(entity => {
      if (entity.visible) {
        entity.render(ctx, spriteManager)
      }
    })

    // Call finishRender to restore camera transform
    this.gameEngine.finishRender()
  }
}

