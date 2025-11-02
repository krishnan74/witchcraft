/**
 * Scene Manager - manages game scenes and transitions
 */
export class SceneManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine
    this.scenes = new Map()
    this.currentScene = null
    this.nextSceneName = null
    this.transitioning = false
  }

  /**
   * Register a scene
   */
  registerScene(name, scene) {
    this.scenes.set(name, scene)
  }

  /**
   * Get a scene by name
   */
  getScene(name) {
    return this.scenes.get(name)
  }

  /**
   * Change to a different scene
   */
  async changeScene(name, transition = false) {
    const scene = this.scenes.get(name)
    if (!scene) {
      console.warn(`Scene "${name}" not found`)
      return
    }

    if (this.currentScene) {
      this.currentScene.onExit()
    }

    this.currentScene = scene
    // Handle both sync and async onEnter
    await scene.onEnter()
    
    console.log(`Changed to scene: ${name}`)
  }

  /**
   * Update current scene
   */
  update(deltaTime) {
    if (this.currentScene) {
      this.currentScene.update(deltaTime)
    }
  }

  /**
   * Render current scene
   */
  render(ctx) {
    if (this.currentScene) {
      this.currentScene.render(ctx)
    }
  }

  /**
   * Get current scene
   */
  getCurrentScene() {
    return this.currentScene
  }
}

