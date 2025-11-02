/**
 * Sprite Manager - handles loading and rendering sprite sheets
 */
export class SpriteManager {
  constructor() {
    this.sprites = new Map()
    this.loaded = false
  }

  /**
   * Load a sprite sheet
   * @param {string} name - Name to store the sprite sheet under
   * @param {string} url - URL/path to the sprite sheet image
   * @param {number} frameWidth - Width of each frame
   * @param {number} frameHeight - Height of each frame
   * @param {Object} options - Additional options (cols, rows, frames, animations)
   */
  async loadSpriteSheet(name, url, frameWidth, frameHeight, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const cols = options.cols || Math.floor(img.width / frameWidth)
        const rows = options.rows || Math.floor(img.height / frameHeight)
        
        const spriteSheet = {
          image: img,
          frameWidth,
          frameHeight,
          cols,
          rows,
          animations: options.animations || {}
        }
        
        this.sprites.set(name, spriteSheet)
        console.log(`Loaded sprite sheet: ${name}`)
        resolve(spriteSheet)
      }
      img.onerror = reject
      img.src = url
    })
  }

  /**
   * Get sprite sheet by name
   */
  getSpriteSheet(name) {
    return this.sprites.get(name)
  }

  /**
   * Draw a single frame from a sprite sheet
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} spriteName - Name of the sprite sheet
   * @param {number} frameIndex - Index of the frame (0-based)
   * @param {number} x - X position to draw
   * @param {number} y - Y position to draw
   * @param {Object} options - Draw options (width, height, flipX, flipY, opacity)
   */
  drawFrame(ctx, spriteName, frameIndex, x, y, options = {}) {
    const spriteSheet = this.sprites.get(spriteName)
    if (!spriteSheet) {
      console.warn(`Sprite sheet "${spriteName}" not found`)
      return
    }

    const { image, frameWidth, frameHeight, cols } = spriteSheet
    
    // Validate image is loaded
    if (!image || !image.complete || image.naturalWidth === 0) {
      console.warn(`Sprite sheet "${spriteName}" image not loaded yet`)
      return
    }

    const col = frameIndex % cols
    const row = Math.floor(frameIndex / cols)

    // Calculate source position - ensure we stay within bounds
    const sx = Math.max(0, Math.min(col * frameWidth, image.width - frameWidth))
    const sy = Math.max(0, Math.min(row * frameHeight, image.height - frameHeight))
    
    // Clamp frame size to ensure we don't read outside image bounds
    const actualFrameWidth = Math.min(frameWidth, image.width - sx)
    const actualFrameHeight = Math.min(frameHeight, image.height - sy)

    const width = options.width || frameWidth
    const height = options.height || frameHeight

    // Debug log first few draws
    if (!this._debugLogged) {
      console.log(`Drawing sprite "${spriteName}" frame ${frameIndex} at (${x}, ${y})`, {
        imageSize: `${image.width}x${image.height}`,
        frameSize: `${frameWidth}x${frameHeight}`,
        source: `(${sx}, ${sy})`,
        dest: `${width}x${height}`
      })
      this._debugLogged = true
      setTimeout(() => { this._debugLogged = false }, 1000)
    }

    ctx.save()

    // Handle opacity
    if (options.opacity !== undefined) {
      ctx.globalAlpha = options.opacity
    }

    // Handle flipping
    if (options.flipX) {
      ctx.scale(-1, 1)
      ctx.translate(-width, 0)
    }
    if (options.flipY) {
      ctx.scale(1, -1)
      ctx.translate(0, -height)
    }

    // Round coordinates to prevent sub-pixel rendering blur/overflow
    const drawX = Math.round(x)
    const drawY = Math.round(y)
    
    // Use clamped frame dimensions to prevent overflow
    ctx.drawImage(
      image,
      sx, sy, actualFrameWidth, actualFrameHeight, // Source rectangle (clamped)
      drawX, drawY, width, height // Destination rectangle (rounded)
    )

    ctx.restore()
  }

  /**
   * Draw an animation frame
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} spriteName - Name of the sprite sheet
   * @param {string} animationName - Name of the animation
   * @param {number} frameTime - Current time or frame counter
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Draw options
   */
  drawAnimation(ctx, spriteName, animationName, frameTime, x, y, options = {}) {
    const spriteSheet = this.sprites.get(spriteName)
    if (!spriteSheet) {
      console.warn(`Sprite sheet "${spriteName}" not found for animation`)
      return
    }

    const animation = spriteSheet.animations[animationName]
    if (!animation) {
      console.warn(`Animation "${animationName}" not found in "${spriteName}"`)
      return
    }

    const frameIndex = animation.frames[Math.floor(frameTime / animation.frameDuration) % animation.frames.length]
    this.drawFrame(ctx, spriteName, frameIndex, x, y, options)
  }
}

// Singleton instance
export const spriteManager = new SpriteManager()

