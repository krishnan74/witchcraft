import { Entity } from './Entity'

/**
 * Building entity - represents interactive buildings in the world
 */
export class Building extends Entity {
  constructor(x, y, name, imagePath) {
    super(x, y)
    this.name = name
    this.imagePath = imagePath
    this.image = null
    this.width = 64  // Default building size
    this.height = 64
    this.interactionRange = 80 // Distance player needs to be to interact (in pixels)
    this.loaded = false
  }

  async loadImage() {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.image = img
        // Scale down buildings to a reasonable size (maintain aspect ratio at max 80px)
        const maxSize = 200 // Maximum width or height - adjust this if you want bigger/smaller buildings
        const aspectRatio = img.width / img.height
        
        if (img.width > img.height) {
          // Wider than tall
          this.width = Math.min(maxSize, img.width)
          this.height = this.width / aspectRatio
        } else {
          // Taller than wide
          this.height = Math.min(maxSize, img.height)
          this.width = this.height * aspectRatio
        }
        
        this.loaded = true
        resolve(img)
      }
      img.onerror = reject
      img.src = this.imagePath
    })
  }

  render(ctx) {
    if (!this.visible || !this.loaded || !this.image) return

    const drawX = Math.round(this.x)
    const drawY = Math.round(this.y)

    ctx.drawImage(
      this.image,
      drawX,
      drawY,
      this.width,
      this.height
    )
  }

  /**
   * Check if a point (player position) is within interaction range
   */
  isPlayerNearby(playerX, playerY, playerWidth, playerHeight) {
    // Calculate center points
    const buildingCenterX = this.x + this.width / 2
    const buildingCenterY = this.y + this.height / 2
    const playerCenterX = playerX + playerWidth / 2
    const playerCenterY = playerY + playerHeight / 2

    // Calculate distance between centers
    const dx = buildingCenterX - playerCenterX
    const dy = buildingCenterY - playerCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance <= this.interactionRange
  }
}

