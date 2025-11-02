import { BaseScene } from './BaseScene'
import { spriteManager } from '../engine/SpriteManager'

/**
 * Shop Scene - Daytime shop management
 */
export class ShopScene extends BaseScene {
  async onEnter() {
    console.log('Entered Shop Scene')
    // Initialize shop scene - update world state to day
    this.setGameState(prev => ({
      ...prev,
      worldState: {
        ...prev.worldState,
        time_of_day: 'Day' // TimeOfDay enum from Dojo
      }
    }))

    // TODO: Load sprite sheets for shop scene
    // await spriteManager.loadSpriteSheet('shop', '/sprites/shop.png', 64, 64)
    
    // TODO: Create shop entities (cauldrons, customers, inventory, etc.)
  }

  update(deltaTime) {
    super.update(deltaTime)
    
    // Shop scene runs during night - don't allow switching manually
    // Day/night cycle will handle scene switching automatically
  }

  render(ctx) {
    // Draw night shop background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.gameEngine.canvas.height)
    gradient.addColorStop(0, '#0a0a1a')
    gradient.addColorStop(1, '#1a0a2e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.gameEngine.canvas.width, this.gameEngine.canvas.height)

    // Draw shop title
    ctx.fillStyle = '#a78bfa'
    ctx.font = '32px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🌙 Night Shop - Open for Business', this.gameEngine.canvas.width / 2, 80)

    // Draw decorative elements
    ctx.fillStyle = 'rgba(167, 139, 250, 0.1)'
    ctx.fillRect(100, 150, this.gameEngine.canvas.width - 200, this.gameEngine.canvas.height - 300)
    ctx.strokeStyle = '#a78bfa'
    ctx.lineWidth = 3
    ctx.strokeRect(100, 150, this.gameEngine.canvas.width - 200, this.gameEngine.canvas.height - 300)

    // Draw instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '18px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('The shop popup is open - check for customer orders!', this.gameEngine.canvas.width / 2, this.gameEngine.canvas.height / 2)
    ctx.fillText('Sell potions to fulfill orders and earn gold', this.gameEngine.canvas.width / 2, this.gameEngine.canvas.height / 2 + 40)

    // Render entities
    super.render(ctx)

    // Draw bottom instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '14px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Press ESC to close shop popup', this.gameEngine.canvas.width / 2, this.gameEngine.canvas.height - 30)
  }
}

