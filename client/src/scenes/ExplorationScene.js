import { BaseScene } from './BaseScene'
import { Entity } from '../engine/Entity'
import { spriteManager } from '../engine/SpriteManager'

/**
 * Exploration Scene - Nighttime ingredient gathering
 */
export class ExplorationScene extends BaseScene {
  constructor(gameEngine, sceneManager, gameState, setGameState) {
    super(gameEngine, sceneManager, gameState, setGameState)
    this.player = null
    this.speed = 3 // Normal movement speed
  }

  async onEnter() {
    console.log('Entered Exploration Scene')
    // Initialize exploration scene
    this.setGameState(prev => ({
      ...prev,
      time: 'night'
    }))

    // Create player entity
    this.player = new Entity(
      this.gameEngine.canvas.width / 2,
      this.gameEngine.canvas.height / 2
    )
    // Will be set after sprite loads
    this.player.width = 100 // Will update based on actual sprite size
    this.player.height = 100
    this.entities.push(this.player)

    // Load individual player sprite images (both left and right)
    try {
      console.log('Loading individual player sprite images...')
      
      // Load right-facing images
      const rightImagePaths = [
        '/sprites/player_right_walk/player_right_idle.png',
        '/sprites/player_right_walk/player_right_walk1.png',
        '/sprites/player_right_walk/player_right_walk2.png',
        '/sprites/player_right_walk/player_right_walk3.png',
        '/sprites/player_right_walk/player_right_walk4.png'
      ]
      
      // Load left-facing images
      const leftImagePaths = [
        '/sprites/player_left_walk/player_left_idle.png',
        '/sprites/player_left_walk/player_left_walk1.png',
        '/sprites/player_left_walk/player_left_walk2.png',
        '/sprites/player_left_walk/player_left_walk3.png',
        '/sprites/player_left_walk/player_left_walk4.png'
      ]
      
      this.player.imagesRight = []
      this.player.imagesLeft = []
      
      // Load right-facing images
      for (const path of rightImagePaths) {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = path
        })
        this.player.imagesRight.push(img)
      }
      
      // Load left-facing images
      for (const path of leftImagePaths) {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = path
        })
        this.player.imagesLeft.push(img)
      }
      
      // Set player size based on first image
      if (this.player.imagesRight[0]) {
        this.player.width = this.player.imagesRight[0].width
        this.player.height = this.player.imagesRight[0].height
      }
      
      // Set up animation frames
      // Walk cycle includes idle at the end: walk1 → walk2 → walk3 → walk4 → idle → repeat
      this.player.animationFrames = {
        idle: [0], // Frame 0 = idle (standalone)
        walk: [1, 2, 3, 4, 0] // Walk cycle: walk1 → walk2 → walk3 → walk4 → idle → repeat
      }
      
      // Animation state
      this.player.currentAnimationFrame = 0
      this.player.animationTime = 0
      this.player.currentAnimation = 'idle'
      this.player.facingDirection = 'right' // 'right' or 'left'
      
      console.log('✅ Player sprites loaded successfully!')
      console.log('📐 Player size:', this.player.width, 'x', this.player.height)
      console.log('🎬 Animations: idle (1 frame), walk (4 frames + idle)')
      console.log('🔄 Direction: Both left and right sprites loaded')
      
    } catch (error) {
      console.error('❌ Player sprites failed to load:', error)
      console.error('Make sure both player_right_walk and player_left_walk folders exist with all 5 images each')
      this.player.imagesRight = null
      this.player.imagesLeft = null
    }
  }

  update(deltaTime) {
    super.update(deltaTime)

    // Handle player movement
    const engine = this.gameEngine
    // Normal movement speed
    const speed = this.speed * (deltaTime / 16.67) // Normalize to 60fps

    if (this.player) {
      this.player.velocity.x = 0
      this.player.velocity.y = 0

      if (engine.isKeyPressed('KeyW') || engine.isKeyPressed('ArrowUp')) {
        this.player.velocity.y = -speed
      }
      if (engine.isKeyPressed('KeyS') || engine.isKeyPressed('ArrowDown')) {
        this.player.velocity.y = speed
      }
      if (engine.isKeyPressed('KeyA') || engine.isKeyPressed('ArrowLeft')) {
        this.player.velocity.x = -speed
        this.player.facingDirection = 'left' // Face left when moving left
      }
      if (engine.isKeyPressed('KeyD') || engine.isKeyPressed('ArrowRight')) {
        this.player.velocity.x = speed
        this.player.facingDirection = 'right' // Face right when moving right
      }

      // Update animation based on movement
      const wasMoving = this.player.velocity.x !== 0 || this.player.velocity.y !== 0
      
      if (wasMoving) {
        this.player.currentAnimation = 'walk'
        // Animate walk cycle: walk1 → walk2 → walk3 → walk4 → idle → repeat
        const walkFrames = this.player.animationFrames?.walk || [1, 2, 3, 4, 0]
        const frameDuration = 150 // ms per frame
        
        // Ensure animation time is initialized and continues smoothly
        if (this.player.animationTime === undefined || this.player.animationTime === null) {
          this.player.animationTime = 0
        }
        
        // Calculate current frame index and update
        const frameIndex = Math.floor(this.player.animationTime / frameDuration) % walkFrames.length
        this.player.currentAnimationFrame = walkFrames[frameIndex]
        
        // Continue animation timer
        this.player.animationTime += deltaTime
      } else {
        // When not moving, show idle frame
        this.player.currentAnimation = 'idle'
        this.player.currentAnimationFrame = 0
        this.player.animationTime = 0 // Reset animation time when idle
      }

      // Keep player on screen - simple bounds
      const minX = 0
      const minY = 0
      const maxX = this.gameEngine.canvas.width - this.player.width
      const maxY = this.gameEngine.canvas.height - this.player.height
      
      // Keep player within canvas bounds
      this.player.x = Math.max(minX, Math.min(maxX, this.player.x))
      this.player.y = Math.max(minY, Math.min(maxY, this.player.y))

      // Disable camera follow - keep camera at origin for now
      this.gameEngine.camera.x = 0
      this.gameEngine.camera.y = 0
    }

    // Press 'E' to return to shop
    if (engine.isKeyPressed('KeyE')) {
      this.sceneManager.changeScene('shop')
    }
  }

  render(ctx) {
    // Save context before drawing background (screen space, not world space)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform to screen space
    
    // Draw dark forest background (screen space)
    const gradient = ctx.createLinearGradient(0, 0, 0, this.gameEngine.canvas.height)
    gradient.addColorStop(0, '#0a0a1a')
    gradient.addColorStop(1, '#1a0a2e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.gameEngine.canvas.width, this.gameEngine.canvas.height)
    
    // Restore transform for world space rendering
    ctx.restore()

    // Draw some background elements (trees, etc.) in world space
    ctx.fillStyle = '#2d1b3d'
    // Draw trees across a larger world area
    for (let i = 0; i < 100; i++) {
      const x = (i * 200) % (this.gameEngine.canvas.width * 10)
      const y = (i * 150) % (this.gameEngine.canvas.height * 10)
      ctx.beginPath()
      ctx.arc(x, y, 30, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw exploration title (screen space)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#a78bfa'
    ctx.font = '24px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🌙 Night Exploration', this.gameEngine.canvas.width / 2, 50)
    ctx.restore()

    // Render entities (but skip player since we handle it separately)
    // We need to manually render other entities, but skip player
    const playerRef = this.player
    this.entities.forEach(entity => {
      if (entity !== playerRef && entity.visible && !entity.images) {
        // Render non-player entities that use sprite sheets
        entity.render(ctx, spriteManager)
      }
    })

    // Draw player sprite (individual images) - use left or right sprites based on direction
    if (this.player && (this.player.imagesRight || this.player.imagesLeft)) {
      const frameIndex = this.player.currentAnimationFrame
      // Choose sprite set based on facing direction
      const currentImageSet = this.player.facingDirection === 'left' 
        ? this.player.imagesLeft 
        : this.player.imagesRight
      const currentImage = currentImageSet?.[frameIndex]
      
      if (currentImage) {
        const drawX = Math.round(this.player.x)
        const drawY = Math.round(this.player.y)
        
        ctx.drawImage(
          currentImage,
          drawX,
          drawY,
          this.player.width,
          this.player.height
        )
      }
    } else if (this.player && !this.player.imagesRight && !this.player.imagesLeft) {
      // Fallback placeholder if images didn't load
      ctx.fillStyle = '#8b5cf6'
      ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height)
      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = 2
      ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height)
    }

    // Draw instructions (screen space)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('WASD/Arrows - Move', 20, this.gameEngine.canvas.height - 60)
    ctx.fillText('Press E - Return to Shop', 20, this.gameEngine.canvas.height - 40)
    ctx.fillText('Gather ingredients and avoid humans!', 20, this.gameEngine.canvas.height - 20)
    ctx.restore()
  }
}

