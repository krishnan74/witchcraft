/**
 * Base Entity class for game objects
 */
export class Entity {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
    this.width = 32
    this.height = 32
    this.velocity = { x: 0, y: 0 }
    this.active = true
    this.visible = true
    this.sprite = null
    this.currentAnimation = null
    this.animationTime = 0
  }

  update(deltaTime) {
    if (!this.active) return

    // Update position based on velocity
    // Velocity already has deltaTime factored in from the scene, so just add it directly
    this.x += this.velocity.x
    this.y += this.velocity.y
    
    // Round to nearest pixel to prevent sub-pixel rendering issues
    this.x = Math.round(this.x * 100) / 100 // Keep some precision for smooth movement
    this.y = Math.round(this.y * 100) / 100

    // Update animation
    if (this.currentAnimation) {
      this.animationTime += deltaTime
    }
  }

  render(ctx, spriteManager) {
    // Skip rendering here if entity has individual images (handled in scene)
    // This is for sprite sheet-based entities
    if (!this.visible) return

    // Check if entity uses individual images (either images or imagesRight/imagesLeft)
    if (this.images || this.imagesRight || this.imagesLeft) {
      // Individual images are handled in the scene, not here
      return
    }

    if (this.sprite) {
      const spriteName = typeof this.sprite === 'string' ? this.sprite : this.sprite.name
      
      if (this.currentAnimation) {
        spriteManager.drawAnimation(
          ctx,
          spriteName,
          this.currentAnimation,
          this.animationTime,
          this.x,
          this.y,
          {
            width: this.width,
            height: this.height
          }
        )
      } else {
        // Fallback: draw first frame if no animation is set
        spriteManager.drawFrame(ctx, spriteName, 0, this.x, this.y, {
          width: this.width,
          height: this.height
        })
      }
    }
    // Removed the red debug rectangle - entities without sprites just won't render
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }

  collidesWith(other) {
    const bounds = this.getBounds()
    const otherBounds = other.getBounds()

    return (
      bounds.x < otherBounds.x + otherBounds.width &&
      bounds.x + bounds.width > otherBounds.x &&
      bounds.y < otherBounds.y + otherBounds.height &&
      bounds.y + bounds.height > otherBounds.y
    )
  }
}

