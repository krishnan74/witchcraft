import { Entity } from './Entity'

/**
 * Ingredient entity - represents collectible ingredients in the world
 */
export class Ingredient extends Entity {
  constructor(x, y, ingredientType, imagePath) {
    super(x, y)
    this.ingredientType = ingredientType // e.g., 'MandrakeRoot', 'GraveDust', etc.
    this.imagePath = imagePath
    this.image = null
    this.width = 60  // Smaller than biomes, similar to collectible size
    this.height = 60
    this.interactionRange = 80 // Distance player needs to be to collect
    this.loaded = false
    this.collected = false
  }

  async loadImage() {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.image = img
        // Scale down ingredients to a reasonable size (maintain aspect ratio at max 60px)
        const maxSize = 60
        const aspectRatio = img.width / img.height
        
        if (img.width > img.height) {
          this.width = Math.min(maxSize, img.width)
          this.height = this.width / aspectRatio
        } else {
          this.height = Math.min(maxSize, img.height)
          this.width = this.height * aspectRatio
        }
        
        this.loaded = true
        resolve(img)
      }
      img.onerror = (e) => {
        console.error(`Failed to load ingredient image: ${this.imagePath}`, e)
        reject(e)
      }
      img.src = this.imagePath
    })
  }

  render(ctx) {
    if (!this.visible || !this.loaded || !this.image || this.collected) return

    const drawX = Math.round(this.x)
    const drawY = Math.round(this.y)

    // Add a subtle glow effect for collectible items
    ctx.save()
    ctx.shadowBlur = 10
    ctx.shadowColor = 'rgba(96, 165, 250, 0.6)'
    
    ctx.drawImage(
      this.image,
      drawX,
      drawY,
      this.width,
      this.height
    )
    
    ctx.restore()
  }

  /**
   * Check if a point (player position) is within interaction range
   */
  isPlayerNearby(playerX, playerY, playerWidth, playerHeight) {
    if (this.collected) return false

    // Calculate center points
    const ingredientCenterX = this.x + this.width / 2
    const ingredientCenterY = this.y + this.height / 2
    const playerCenterX = playerX + playerWidth / 2
    const playerCenterY = playerY + playerHeight / 2

    // Calculate distance between centers
    const dx = ingredientCenterX - playerCenterX
    const dy = ingredientCenterY - playerCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance <= this.interactionRange
  }
}

