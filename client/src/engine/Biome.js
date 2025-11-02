import { Entity } from './Entity'

/**
 * Biome entity - represents distinct environmental zones in the world
 */
export class Biome extends Entity {
  constructor(x, y, name, imagePath, zoneType) {
    super(x, y)
    this.name = name
    this.imagePath = imagePath
    this.zoneType = zoneType // Corresponds to Dojo ZoneType enum
    this.image = null
    this.width = 150  // Small biome size (similar to buildings)
    this.height = 150
    this.interactionRange = 150 // Distance player needs to be to trigger popup
    this.loaded = false
  }

  async loadImage() {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.image = img
        // Scale down biomes to a reasonable size (maintain aspect ratio at max 150px)
        const maxSize = 150 // Maximum width or height - slightly larger than buildings
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
      img.onerror = (e) => {
        console.error(`Failed to load biome image: ${this.imagePath}`, e)
        reject(e)
      }
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
    const biomeCenterX = this.x + this.width / 2
    const biomeCenterY = this.y + this.height / 2
    const playerCenterX = playerX + playerWidth / 2
    const playerCenterY = playerY + playerHeight / 2

    // Calculate distance between centers
    const dx = biomeCenterX - playerCenterX
    const dy = biomeCenterY - playerCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance <= this.interactionRange
  }
}

