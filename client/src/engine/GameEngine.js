/**
 * Core game engine - handles game loop, rendering, and timing
 */
export class GameEngine {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.lastTime = 0
    this.deltaTime = 0
    this.fps = 60
    this.frameTime = 1000 / this.fps
    
    // Camera
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1
    }
    
    // Input handling
    this.keys = {}
    this.mouse = {
      x: 0,
      y: 0,
      down: false
    }
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser default behavior for arrow keys and WASD to avoid window navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyB', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
      this.keys[e.code] = true
    })
    
    window.addEventListener('keyup', (e) => {
      // Prevent browser default behavior for arrow keys and WASD
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyB', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
      this.keys[e.code] = false
    })
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      this.mouse.x = e.clientX - rect.left
      this.mouse.y = e.clientY - rect.top
    })
    
    this.canvas.addEventListener('mousedown', () => {
      this.mouse.down = true
    })
    
    this.canvas.addEventListener('mouseup', () => {
      this.mouse.down = false
    })
  }

  update(currentTime) {
    // Calculate delta time
    if (this.lastTime === 0) {
      this.lastTime = currentTime
    }
    
    this.deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    
    // Limit delta time to prevent large jumps
    if (this.deltaTime > 100) {
      this.deltaTime = this.frameTime
    }
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Apply camera transform (disabled for now to fix rendering)
    this.ctx.save()
    // Only apply transform if camera is not at origin
    if (this.camera.x !== 0 || this.camera.y !== 0) {
      this.ctx.translate(-this.camera.x, -this.camera.y)
    }
    if (this.camera.zoom !== 1) {
      this.ctx.scale(this.camera.zoom, this.camera.zoom)
    }
  }

  finishRender() {
    this.ctx.restore()
  }

  isKeyPressed(key) {
    return this.keys[key] || false
  }

  isMouseDown() {
    return this.mouse.down
  }

  getMouseWorldPos() {
    return {
      x: (this.mouse.x / this.camera.zoom) + this.camera.x,
      y: (this.mouse.y / this.camera.zoom) + this.camera.y
    }
  }

  cleanup() {
    // Clean up event listeners if needed
    this.keys = {}
    this.mouse.down = false
  }
}

