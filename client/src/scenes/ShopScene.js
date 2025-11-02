import { BaseScene } from './BaseScene'
import { spriteManager } from '../engine/SpriteManager'

/**
 * Shop Scene - Daytime shop management
 */
export class ShopScene extends BaseScene {
  async onEnter() {
    console.log('Entered Shop Scene')
    // Initialize shop scene
    this.setGameState(prev => ({
      ...prev,
      time: 'day'
    }))

    // TODO: Load sprite sheets for shop scene
    // await spriteManager.loadSpriteSheet('shop', '/sprites/shop.png', 64, 64)
    
    // TODO: Create shop entities (cauldrons, customers, inventory, etc.)
  }

  update(deltaTime) {
    super.update(deltaTime)
    
    // Handle input for shop interactions
    const engine = this.gameEngine
    
    // Press 'E' to switch to exploration mode
    if (engine.isKeyPressed('KeyE')) {
      this.sceneManager.changeScene('exploration')
    }
  }

  render(ctx) {
    // Draw shop background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, this.gameEngine.canvas.width, this.gameEngine.canvas.height)

    // Draw shop title
    ctx.fillStyle = '#a78bfa'
    ctx.font = '24px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🧪 Witch\'s Shop', this.gameEngine.canvas.width / 2, 50)

    // Draw placeholder UI
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)'
    ctx.fillRect(100, 100, 200, 300)
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 2
    ctx.strokeRect(100, 100, 200, 300)

    ctx.fillStyle = '#fff'
    ctx.font = '16px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('Cauldron Area', 120, 130)
    ctx.fillText('(Press E to explore)', 120, 150)

    // Render entities
    super.render(ctx)

    // Draw instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('Press E - Go to Exploration', 20, this.gameEngine.canvas.height - 40)
    ctx.fillText('Press B - Open Brewing Menu', 20, this.gameEngine.canvas.height - 20)
  }
}

