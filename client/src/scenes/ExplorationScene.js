import { BaseScene } from './BaseScene'
import { Entity } from '../engine/Entity'
import { Building } from '../engine/Building'
import { Biome } from '../engine/Biome'
import { Ingredient } from '../engine/Ingredient'
import { getRecipeForDay, INGREDIENT_DISPLAY, INGREDIENT_ZONE_MAP } from '../data/recipes'
import { spriteManager } from '../engine/SpriteManager'

/**
 * Exploration Scene - Nighttime ingredient gathering
 */
export class ExplorationScene extends BaseScene {
  constructor(gameEngine, sceneManager, gameState, setGameState) {
    super(gameEngine, sceneManager, gameState, setGameState)
    this.player = null
    this.speed = 3 // Normal movement speed
    this.backgroundImage = null
    this.backgroundImageDay = null
    this.backgroundImageNight = null
    this.buildings = []
    this.nearbyBuilding = null // Currently nearby building for popup
    this.biomes = [] // Array to hold biome entities
    this.nearbyBiome = null // Currently nearby biome for popup
    this.ingredients = [] // Array to hold ingredient entities
    this.npcs = [] // Array to hold NPC entities
    this.nearbyIngredient = null // Currently nearby ingredient for collection
    this.ingredientSpawnTimer = 0 // Timer for spawning ingredients at intervals
    this.ingredientSpawnInterval = 15000 // Spawn new ingredients every 20 seconds
    // World bounds - same as canvas size
    this.worldWidth = 1920
    this.worldHeight = 1080
    this.playerDead = false
    this.lastMouseState = false // Track mouse state for click detection
    this.playerAttackRange = 100 // Distance player can attack NPCs
  }

  async onEnter() {
    console.log('Entered Exploration Scene')
    // Initialize exploration scene - update world state to day (if not already set)
    // Note: Day/night cycle is managed by App.jsx, but we ensure position is set
    this.setGameState(prev => ({
      ...prev,
      position: {
        ...prev.position,
        zone: 'Forest' // ZoneType enum from Dojo
      }
    }))

    // Load background images (day and night)
    try {
      // Load day background (grass.png)
      const bgImgDay = new Image()
      await new Promise((resolve, reject) => {
        bgImgDay.onload = resolve
        bgImgDay.onerror = reject
        bgImgDay.src = '/sprites/grass.png'
      })
      this.backgroundImageDay = bgImgDay
      console.log('✅ Day background image loaded:', bgImgDay.width, 'x', bgImgDay.height)
      
      // Load night background (night.png)
      const bgImgNight = new Image()
      await new Promise((resolve, reject) => {
        bgImgNight.onload = resolve
        bgImgNight.onerror = reject
        bgImgNight.src = '/sprites/night.png'
      })
      this.backgroundImageNight = bgImgNight
      console.log('✅ Night background image loaded:', bgImgNight.width, 'x', bgImgNight.height)
      
      // Set initial background based on current time of day
      this.updateBackgroundImage()
    } catch (error) {
      console.warn('Background image not found, using default gradient', error)
      this.backgroundImageDay = null
      this.backgroundImageNight = null
      this.backgroundImage = null
    }

          // Create player entity - start at canvas center
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

    // Create and place buildings first
    await this.initializeBuildings()

    // Create and place biomes (after buildings so we can avoid overlap)
    await this.initializeBiomes()

    // Create and place NPCs near biomes
    await this.initializeNPCs()

    // Clear any old ingredients and spawn fresh ones for current day
    this.ingredients = []
    const currentDay = this.gameState.worldState.day || 1
    await this.spawnIngredientBatch()
    
    console.log(`✅ Exploration scene initialized - Day ${currentDay}`)
  }
  
  /**
   * Called when day changes - clean up old ingredients and spawn new ones
   */
  async onDayChange(newDay) {
    console.log(`📅 Day changed to ${newDay} - updating unlocked ingredients`)
    
    // Get all ingredient types that should be unlocked for new day
    const allUnlockedIngredients = new Set()
    for (let day = 1; day <= newDay; day++) {
      const recipe = getRecipeForDay(day)
      recipe.ingredients.forEach(ri => {
        allUnlockedIngredients.add(ri.ingredient_type)
      })
    }
    
    console.log(`🌿 Unlocked ingredients for Day ${newDay}:`, Array.from(allUnlockedIngredients))
    
    // Remove ingredients that are no longer unlocked (future days)
    // Keep all ingredients that match unlocked types
    const beforeCount = this.ingredients.length
    this.ingredients = this.ingredients.filter(ing => {
      if (ing.collected) return true // Keep collected ingredients
      // Get ingredient type - check both property names
      const ingredientType = ing.ingredientType || ing.ingredient_type
      if (!ingredientType) {
        // If no type, keep it for now (legacy)
        return true
      }
      // Keep ingredients whose type is in the unlocked set
      return allUnlockedIngredients.has(ingredientType)
    })
    const afterCount = this.ingredients.length
    if (beforeCount !== afterCount) {
      console.log(`🧹 Filtered ingredients: ${beforeCount} → ${afterCount} (kept ${allUnlockedIngredients.size} unlocked types)`)
    }
    
    // Spawn fresh ingredients for all unlocked days (1 through newDay)
    await this.spawnIngredientBatch()
  }

  async initializeBuildings() {
    // Define building positions (spread out across the map)
    // Coordinates stored with names for easy reference later
    const buildingData = [
      {
        name: 'Shop',
        imagePath: '/sprites/shop.png',
        x: 200,  // Top-left area
        y: 150
      },
      {
        name: 'Cauldron',
        imagePath: '/sprites/cauldron.png',
        x: 1400,  // Top-right area
        y: 200
      },
      {
        name: 'Recipe Book',
        imagePath: '/sprites/book.png',
        x: 800,  // Center area
        y: 600
      }
    ]

    // Create building entities
    for (const data of buildingData) {
      const building = new Building(data.x, data.y, data.name, data.imagePath)
      
      // Store coordinates tied to name for later reference
      building.coords = { x: data.x, y: data.y }
      
      // Load building image
      try {
        await building.loadImage()
        this.buildings.push(building)
        console.log(`✅ Building "${data.name}" placed at (${data.x}, ${data.y})`)
      } catch (error) {
        console.warn(`⚠️ Failed to load building "${data.name}" image:`, data.imagePath)
      }
    }

    console.log(`📦 Total buildings placed: ${this.buildings.length}`)
    console.log('🏗️ Building locations:', this.buildings.map(b => `${b.name}: (${b.coords.x}, ${b.coords.y})`))
  }

  async initializeBiomes() {
    // Define biome positions - fixed coordinates, well-spaced across the map
    // Biomes are small (similar to buildings) and placed strategically on the grass background
    const biomeData = [
      {
        name: 'Forest',
        imagePath: '/sprites/forest.png',
        zoneType: 'Forest',
        x: 100,
        y: 500
      },
      {
        name: 'Graveyard',
        imagePath: '/sprites/graveyard.png',
        zoneType: 'Graveyard',
        x: 750,
        y: 200
      },
      {
        name: 'Cursed Village',
        imagePath: '/sprites/cursed_village.png',
        zoneType: 'CursedVillage',
        x: 1200,
        y: 0
      },
      {
        name: 'Swamp',
        imagePath: '/sprites/swamp.png',
        zoneType: 'Swamp',
        x: 500,
        y: 800
      },
      {
        name: 'Ruins',
        imagePath: '/sprites/ruins.png',
        zoneType: 'Ruins',
        x: 1200,
        y: 600
      },
      {
        name: 'Mountain Pass',
        imagePath: '/sprites/mountain_pass.png',
        zoneType: 'MountainPass',
        x: 1700,
        y: 800
      }
    ]

    // Create biome entities with fixed positions
    for (const data of biomeData) {
      const biome = new Biome(data.x, data.y, data.name, data.imagePath, data.zoneType)
      
      // Load biome image (will set actual width/height in loadImage)
      try {
        await biome.loadImage()
        
        // Store coordinates tied to name for later reference
        biome.coords = { x: biome.x, y: biome.y, width: biome.width, height: biome.height }
        
        this.biomes.push(biome)
        console.log(`✅ Biome "${data.name}" placed at (${Math.round(biome.x)}, ${Math.round(biome.y)}) with size ${Math.round(biome.width)}x${Math.round(biome.height)}`)
      } catch (error) {
        console.warn(`⚠️ Failed to load biome "${data.name}" image:`, data.imagePath)
      }
    }

    console.log(`🌍 Total biomes placed: ${this.biomes.length}`)
    console.log('🗺️ Biome Locations & Coordinates:')
    console.table(this.biomes.map(b => ({
      Name: b.name,
      'X': Math.round(b.coords.x),
      'Y': Math.round(b.coords.y),
      'Width': Math.round(b.coords.width),
      'Height': Math.round(b.coords.height),
      'Zone Type': b.zoneType
    })))
  }

  async initializeNPCs() {
    // Load NPC attack animation frames (1.png, 2.png, 3.png, 4.png)
    const npcImagePaths = [
      '/sprites/npc/1.png',
      '/sprites/npc/2.png',
      '/sprites/npc/3.png',
      '/sprites/npc/4.png'
    ]

    let npcAttackFrames = []
    try {
      // Load all NPC attack frames
      for (const path of npcImagePaths) {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = path
        })
        npcAttackFrames.push(img)
      }
      console.log(`✅ NPC attack frames loaded: ${npcAttackFrames.length} frames`)
    } catch (error) {
      console.warn('⚠️ Failed to load NPC sprites:', error)
      return // Don't create NPCs if sprites failed to load
    }

    // Place NPCs near each biome (outside or near edges)
    // Each biome gets exactly 1 NPC placed around it
    for (const biome of this.biomes) {
      // Place NPCs at various positions around the biome
      const npcPositions = [
        // Left side of biome
        { x: biome.x - 100, y: biome.y + biome.height / 2 },
        // Right side of biome
        { x: biome.x + biome.width + 50, y: biome.y + biome.height / 2 },
        // Top of biome
        { x: biome.x + biome.width / 2, y: biome.y - 100 },
        // Bottom of biome (only for larger biomes)
        ...(biome.width > 200 ? [{ x: biome.x + biome.width / 2, y: biome.y + biome.height + 50 }] : [])
      ]

      // Create exactly 1 NPC per biome (randomly choose one position)
      const randomPositionIndex = Math.floor(Math.random() * npcPositions.length)
      const selectedPositions = [npcPositions[randomPositionIndex]]

      for (const pos of selectedPositions) {
        // Make sure NPC is within world bounds
        const npcX = Math.max(50, Math.min(this.worldWidth - 100, pos.x))
        const npcY = Math.max(50, Math.min(this.worldHeight - 100, pos.y))

        // Create NPC entity
        const npc = new Entity(npcX, npcY)
        
        // Set NPC size based on first frame
        if (npcAttackFrames[0]) {
          npc.width = npcAttackFrames[0].width || 64
          npc.height = npcAttackFrames[0].height || 64
        }

        // Store attack frames
        npc.attackFrames = npcAttackFrames
        npc.currentFrame = 0
        npc.animationTime = 0
        npc.frameDuration = 200 // ms per frame (controls attack animation speed)
        
        // Store which biome this NPC is guarding
        npc.guardingBiome = biome.name
        npc.biome = biome // Reference to the biome entity
        npc.originalX = npcX // Store original spawn position
        npc.originalY = npcY
        npc.detectionRadius = 250 // Distance from biome center to detect player
        npc.followSpeed = 2.5 // NPC movement speed (slightly slower than player)
        npc.isFollowing = false // Track if NPC is currently following player
        npc.attackRange = 70 // Distance to land an attack
        npc.attackDamage = 10 // Damage per hit
        npc.attackCooldownMs = 1000 // 1s between hits
        npc._attackTimerMs = 0

        this.npcs.push(npc)
        this.entities.push(npc) // Add to entities for update/render
        
        console.log(`✅ NPC placed near ${biome.name} at (${Math.round(npcX)}, ${Math.round(npcY)})`)
      }
    }

    console.log(`👹 Total NPCs placed: ${this.npcs.length}`)
  }

  /**
   * Spawn a batch of ingredients (one of each type that can spawn today)
   * This is called continuously at intervals
   */
  async spawnIngredientBatch() {
    // Get current day - spawn all ingredients unlocked up to this day
    const currentDay = this.gameState.worldState.day || 1
    
    // Map ingredient types to image paths
    const ingredientImageMap = {
      MandrakeRoot: '/sprites/mandrake_root.png',
      GraveDust: '/sprites/grave_dust.png',
      BatWing: '/sprites/bat_wing.png',
      GhostMushroom: '/sprites/ghost_mushroom.png',
      WyrmScale: '/sprites/wyrm_scale.png',
      VampireBloom: '/sprites/vampire_bloom.png',
      PumpkinSeed: '/sprites/pumpkin_seed.png'
    }

    // Get all unique ingredient types from ALL recipes unlocked up to current day (Day 1 through current day)
    const allUnlockedIngredients = new Set()
    for (let day = 1; day <= currentDay; day++) {
      const recipe = getRecipeForDay(day)
      recipe.ingredients.forEach(ri => {
        allUnlockedIngredients.add(ri.ingredient_type)
      })
    }
    
    const ingredientTypes = Array.from(allUnlockedIngredients)
    
    console.log(`📅 Day ${currentDay} - Spawning all unlocked ingredients (Days 1-${currentDay})`)
    console.log(`🌿 Unlocked ingredients: ${ingredientTypes.join(', ')}`)

    // Spawn one ingredient of each unlocked type (allow multiple instances)
    for (const ingredientType of ingredientTypes) {
      const imagePath = ingredientImageMap[ingredientType]
      
      if (!imagePath) {
        console.warn(`⚠️ No image path found for ingredient: ${ingredientType}`)
        continue
      }

      // Find the biome where this ingredient should spawn
      const targetZone = INGREDIENT_ZONE_MAP[ingredientType]
      const targetBiome = this.biomes.find(b => b.zoneType === targetZone)
      
      if (!targetBiome) {
        console.warn(`⚠️ No biome found for zone: ${targetZone} (ingredient: ${ingredientType})`)
        continue
      }

      // Random position within the biome bounds
      const padding = 20 // Padding from biome edges
      const maxX = targetBiome.x + targetBiome.width - padding - 60
      const maxY = targetBiome.y + targetBiome.height - padding - 60
      const minX = targetBiome.x + padding
      const minY = targetBiome.y + padding

      let x = Math.random() * (maxX - minX) + minX
      let y = Math.random() * (maxY - minY) + minY

      // Try to avoid overlapping with other ingredients
      // Only check against ingredients of the same type to allow multiple types to spawn
      let attempts = 0
      let overlap = true
      while (overlap && attempts < 10) {
        overlap = false
        for (const existingIngredient of this.ingredients) {
          if (existingIngredient.collected) continue // Ignore collected ingredients
          
          // Check if it's the same ingredient type
          const existingType = existingIngredient.ingredientType || existingIngredient.ingredient_type
          if (existingType !== ingredientType) continue // Allow different types to overlap
          
          const distance = Math.sqrt(
            Math.pow(x - (existingIngredient.x + existingIngredient.width / 2), 2) +
            Math.pow(y - (existingIngredient.y + existingIngredient.height / 2), 2)
          )
          if (distance < 80) { // Minimum distance between ingredients of same type
            overlap = true
            x = Math.random() * (maxX - minX) + minX
            y = Math.random() * (maxY - minY) + minY
            attempts++
            break
          }
        }
        if (!overlap) break
      }

      const ingredient = new Ingredient(x, y, ingredientType, imagePath)
      
      try {
        await ingredient.loadImage()
        ingredient.coords = { x: ingredient.x, y: ingredient.y, zoneType: targetZone }
        // Track which day this ingredient type was unlocked (first day it appears in a recipe)
        ingredient.spawnDay = this.getIngredientUnlockDay(ingredientType, currentDay)
        this.ingredients.push(ingredient)
        console.log(`✅ Spawned ${ingredientType} at (${Math.round(x)}, ${Math.round(y)}) in ${targetZone} (Unlocked Day ${ingredient.spawnDay})`)
      } catch (error) {
        console.warn(`⚠️ Failed to load ingredient image: ${imagePath}`)
      }
    }
    
    console.log(`✅ Spawned ${ingredientTypes.length} ingredient types for Day ${currentDay} (Days 1-${currentDay} unlocked)`)
  }

  /**
   * Get the day when an ingredient type was first unlocked (first appears in a recipe)
   */
  getIngredientUnlockDay(ingredientType, maxDay) {
    for (let day = 1; day <= maxDay; day++) {
      const recipe = getRecipeForDay(day)
      if (recipe.ingredients.some(ri => ri.ingredient_type === ingredientType)) {
        return day
      }
    }
    return maxDay // Fallback to current day if not found
  }

  update(deltaTime) {
    super.update(deltaTime)

    // Update ingredient spawn timer
    this.ingredientSpawnTimer += deltaTime
    if (this.ingredientSpawnTimer >= this.ingredientSpawnInterval) {
      this.ingredientSpawnTimer = 0
      
      // Get current day and all unlocked ingredient types
      const currentDay = this.gameState.worldState.day || 1
      
      // Get all ingredient types that should be unlocked
      const allUnlockedIngredients = new Set()
      for (let day = 1; day <= currentDay; day++) {
        const recipe = getRecipeForDay(day)
        recipe.ingredients.forEach(ri => {
          allUnlockedIngredients.add(ri.ingredient_type)
        })
      }
      
      // Only remove ingredients that are from future days (not in unlocked set)
      // Keep all ingredients that match unlocked types
      this.ingredients = this.ingredients.filter(ing => {
        if (ing.collected) return true // Keep collected ingredients
        // Get ingredient type - check both property names
        const ingredientType = ing.ingredientType || ing.ingredient_type
        if (!ingredientType) return true // Keep legacy ingredients without type
        // Check if ingredient type is still unlocked
        return allUnlockedIngredients.has(ingredientType)
      })
      
      // Spawn a new batch of ingredients for all unlocked days
      this.spawnIngredientBatch()
    }

    // Handle player movement
    const engine = this.gameEngine
    // Normal movement speed
    const speed = this.speed * (deltaTime / 16.67) // Normalize to 60fps

    if (this.player) {
      // If dead, lock the player and skip movement
      if (this.playerDead) {
        this.player.velocity.x = 0
        this.player.velocity.y = 0
      } else {
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
      }

            // Keep player within world bounds (larger map)
            const minX = 0
            const minY = 0
            const maxX = this.worldWidth - this.player.width
            const maxY = this.worldHeight - this.player.height
            
            // Keep player within world bounds
            this.player.x = Math.max(minX, Math.min(maxX, this.player.x))
            this.player.y = Math.max(minY, Math.min(maxY, this.player.y))

      // Check if player is near any building
      this.nearbyBuilding = null
      for (const building of this.buildings) {
        if (building.isPlayerNearby(
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height
        )) {
          this.nearbyBuilding = building
          break // Only show one building popup at a time
        }
      }

      // Check if player is near any ingredient (highest priority for collection)
      this.nearbyIngredient = null
      for (const ingredient of this.ingredients) {
        if (!ingredient.collected && ingredient.isPlayerNearby(
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height
        )) {
          this.nearbyIngredient = ingredient
          break // Only show one ingredient popup at a time
        }
      }

      // Check if player is near any biome (only if not near building or ingredient)
      this.nearbyBiome = null
      if (!this.nearbyBuilding && !this.nearbyIngredient) {
        for (const biome of this.biomes) {
          if (biome.isPlayerNearby(
            this.player.x,
            this.player.y,
            this.player.width,
            this.player.height
          )) {
            this.nearbyBiome = biome
            break // Only show one biome popup at a time
          }
        }
      }

      // Camera follows player (centered on player)
      // Since world = canvas, camera stays centered
      const cameraX = this.player.x - this.gameEngine.canvas.width / 2 + this.player.width / 2
      const cameraY = this.player.y - this.gameEngine.canvas.height / 2 + this.player.height / 2
      
      // Clamp camera to world bounds (world = canvas, so camera should stay at 0,0 or minimal movement)
      const maxCameraX = Math.max(0, this.worldWidth - this.gameEngine.canvas.width)
      const maxCameraY = Math.max(0, this.worldHeight - this.gameEngine.canvas.height)
      
      this.gameEngine.camera.x = Math.max(0, Math.min(maxCameraX, cameraX))
      this.gameEngine.camera.y = Math.max(0, Math.min(maxCameraY, cameraY))
    }

    // Update NPCs: animations and follow behavior
    if (this.player) {
      const playerCenterX = this.player.x + this.player.width / 2
      const playerCenterY = this.player.y + this.player.height / 2

      this.npcs.forEach(npc => {
        // Update NPC attack animation
        if (npc.attackFrames && npc.attackFrames.length > 0) {
          npc.animationTime += deltaTime
          
          // Loop through frames: 1 -> 2 -> 3 -> 4 -> 1 -> ...
          const frameIndex = Math.floor(npc.animationTime / npc.frameDuration) % npc.attackFrames.length
          npc.currentFrame = frameIndex
        }

        // Advance attack cooldown timer
        npc._attackTimerMs = (npc._attackTimerMs || 0) + deltaTime

        // Check if player is within detection radius of the biome this NPC guards
        if (npc.biome) {
          const biomeCenterX = npc.biome.x + npc.biome.width / 2
          const biomeCenterY = npc.biome.y + npc.biome.height / 2
          
          const distanceToBiomeCenter = Math.sqrt(
            Math.pow(playerCenterX - biomeCenterX, 2) + 
            Math.pow(playerCenterY - biomeCenterY, 2)
          )

          // If player is within detection radius, NPC should follow
          if (distanceToBiomeCenter <= npc.detectionRadius) {
            npc.isFollowing = true
            
            // Move NPC toward player
            const npcCenterX = npc.x + npc.width / 2
            const npcCenterY = npc.y + npc.height / 2
            
            const dx = playerCenterX - npcCenterX
            const dy = playerCenterY - npcCenterY
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy)
            
            if (distanceToPlayer > 10) { // Don't move if very close (prevents jitter)
              // Normalize direction and apply speed
              const speed = npc.followSpeed * (deltaTime / 16.67) // Normalize to 60fps
              npc.velocity.x = (dx / distanceToPlayer) * speed
              npc.velocity.y = (dy / distanceToPlayer) * speed
              
              // Keep NPC within world bounds
              const newX = npc.x + npc.velocity.x
              const newY = npc.y + npc.velocity.y
              if (newX < 0 || newX + npc.width > this.worldWidth) {
                npc.velocity.x = 0
              }
              if (newY < 0 || newY + npc.height > this.worldHeight) {
                npc.velocity.y = 0
              }
            } else {
              npc.velocity.x = 0
              npc.velocity.y = 0
            }

            // Attempt attack if in range and cooldown elapsed
            if (distanceToPlayer <= npc.attackRange && npc._attackTimerMs >= npc.attackCooldownMs && !this.playerDead) {
              npc._attackTimerMs = 0

              const currentHealth = (this.gameState?.player?.health ?? 0)
              const newHealth = Math.max(0, currentHealth - npc.attackDamage)

              // Update React state
              this.setGameState(prev => ({
                ...prev,
                player: {
                  ...prev.player,
                  health: newHealth
                }
              }))
              // Keep scene copy in sync immediately
              if (this.gameState && this.gameState.player) {
                this.gameState.player.health = newHealth
              }

              // Handle death
              if (newHealth <= 0) {
                this.playerDead = true
                console.log('💀 Player died')
              }
            }
          } else {
            // Player left detection radius - return to original position
            npc.isFollowing = false
            
            const npcCenterX = npc.x + npc.width / 2
            const npcCenterY = npc.y + npc.height / 2
            const dx = npc.originalX + npc.width / 2 - npcCenterX
            const dy = npc.originalY + npc.height / 2 - npcCenterY
            const distanceToHome = Math.sqrt(dx * dx + dy * dy)
            
            if (distanceToHome > 5) {
              // Move back to original position
              const speed = npc.followSpeed * 0.8 * (deltaTime / 16.67) // Slightly slower return
              npc.velocity.x = (dx / distanceToHome) * speed
              npc.velocity.y = (dy / distanceToHome) * speed
            } else {
              // Close enough to home, stop moving
              npc.velocity.x = 0
              npc.velocity.y = 0
              npc.x = npc.originalX
              npc.y = npc.originalY
            }
          }
        }
      })
    }

    // Handle left click to kill nearby NPCs (only trigger once per click)
    const currentMouseState = engine.isMouseDown()
    const mouseJustClicked = currentMouseState && !this.lastMouseState
    
    if (mouseJustClicked && this.player && !this.playerDead) {
      // Get mouse position in world coordinates
      const mouseWorldPos = engine.getMouseWorldPos()
      
      // Check all NPCs to see if click hit them and they're within attack range
      // Iterate in reverse to safely remove items
      for (let i = this.npcs.length - 1; i >= 0; i--) {
        const npc = this.npcs[i]
        if (!npc.visible || !npc.active) continue
        
        // Check if NPC is within player attack range
        const playerCenterX = this.player.x + this.player.width / 2
        const playerCenterY = this.player.y + this.player.height / 2
        const npcCenterX = npc.x + npc.width / 2
        const npcCenterY = npc.y + npc.height / 2
        
        const distanceToNPC = Math.sqrt(
          Math.pow(playerCenterX - npcCenterX, 2) + 
          Math.pow(playerCenterY - npcCenterY, 2)
        )
        
        // Check if click is on the NPC and NPC is within attack range
        const clickOnNPC = (
          mouseWorldPos.x >= npc.x &&
          mouseWorldPos.x <= npc.x + npc.width &&
          mouseWorldPos.y >= npc.y &&
          mouseWorldPos.y <= npc.y + npc.height
        )
        
        if (clickOnNPC && distanceToNPC <= this.playerAttackRange) {
          // Kill the NPC (remove it)
          npc.visible = false
          npc.active = false
          
          // Remove from arrays
          this.npcs.splice(i, 1)
          const entityIndex = this.entities.indexOf(npc)
          if (entityIndex > -1) {
            this.entities.splice(entityIndex, 1)
          }
          
          // Restore player health when killing NPC
          const healthRestored = 15 // Amount of health restored per kill
          const currentHealth = this.gameState?.player?.health ?? 0
          const maxHealth = 100 // Max health cap
          const newHealth = Math.min(maxHealth, currentHealth + healthRestored)
          
          // Update game state
          this.setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              health: newHealth
            }
          }))
          
          // Keep scene copy in sync
          if (this.gameState && this.gameState.player) {
            this.gameState.player.health = newHealth
          }
          
          // Revive player if they were dead
          if (this.playerDead && newHealth > 0) {
            this.playerDead = false
          }
          
          console.log(`💀 NPC killed at (${Math.round(npc.x)}, ${Math.round(npc.y)}) - Health restored: +${healthRestored}`)
          break // Only kill one NPC per click
        }
      }
    }
    
    this.lastMouseState = currentMouseState

    // Press 'E' to interact with nearby ingredient or building (if any)
    // Handle E key press (only trigger once, not continuously)
    if (!this._lastEKeyState && engine.isKeyPressed('KeyE')) {
      this._lastEKeyState = true
      
      // Prioritize ingredient collection over building interaction
      if (this.nearbyIngredient && !this.nearbyIngredient.collected) {
        this.collectIngredient(this.nearbyIngredient)
      } else if (this.nearbyBuilding) {
        console.log(`Interacting with ${this.nearbyBuilding.name} at (${this.nearbyBuilding.coords.x}, ${this.nearbyBuilding.coords.y})`)
        
        // Handle different building types
        if (this.nearbyBuilding.name === 'Recipe Book') {
          // Trigger recipe book popup
          this.onRecipeBookInteract?.()
        } else if (this.nearbyBuilding.name === 'Cauldron') {
          // Trigger cauldron popup for brewing
          this.onCauldronInteract?.()
        } else if (this.nearbyBuilding.name === 'Shop') {
          // Trigger shop popup (only during night)
          this.onShopInteract?.()
        }
      }
    } else if (!engine.isKeyPressed('KeyE')) {
      this._lastEKeyState = false
    }
  }

  /**
   * Update background image based on current time of day
   */
  updateBackgroundImage() {
    const timeOfDay = this.gameState?.worldState?.time_of_day
    if (timeOfDay === 'Night' && this.backgroundImageNight) {
      this.backgroundImage = this.backgroundImageNight
    } else if (this.backgroundImageDay) {
      this.backgroundImage = this.backgroundImageDay
    } else {
      this.backgroundImage = null
    }
  }

  render(ctx) {
    // Update background image based on time of day
    this.updateBackgroundImage()
    
    // Draw background (grass for day, night for night) - in world space, camera transform already applied by GameEngine
    if (this.backgroundImage && this.backgroundImage.complete) {
      // Draw background covering the entire world
      ctx.drawImage(
        this.backgroundImage,
        0, 0, // World origin
        this.worldWidth,
        this.worldHeight
      )
    } else {
      // Fallback: dark forest background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, this.worldHeight)
      gradient.addColorStop(0, '#0a0a1a')
      gradient.addColorStop(1, '#1a0a2e')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight)
    }

    // Draw biomes on top of grass (small, randomly placed)
    this.biomes.forEach(biome => {
      biome.render(ctx)
    })

    // Draw ingredients on top of biomes
    this.ingredients.forEach(ingredient => {
      ingredient.render(ctx)
    })

    // Draw NPCs (attack animation loop)
    this.npcs.forEach(npc => {
      if (npc.visible && npc.attackFrames && npc.attackFrames.length > 0) {
        const currentImage = npc.attackFrames[npc.currentFrame]
        if (currentImage && currentImage.complete) {
          const drawX = Math.round(npc.x)
          const drawY = Math.round(npc.y)
          
          ctx.drawImage(
            currentImage,
            drawX,
            drawY,
            npc.width,
            npc.height
          )
        }
      }
    })

    // Background elements will be added later (trees, objects, etc.)

    // Draw exploration title (screen space - need to reset transform)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#a78bfa'
    ctx.font = '24px monospace'
    ctx.textAlign = 'center'
    const timeOfDay = this.gameState.worldState.time_of_day
    const title = timeOfDay === 'Night' ? '🌙 Night Exploration' : '☀️ Day Exploration'
    ctx.fillText(title, this.gameEngine.canvas.width / 2, 50)

    // If player is dead, overlay a message
    if (this.playerDead) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(0, 0, this.gameEngine.canvas.width, this.gameEngine.canvas.height)
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 64px monospace'
      ctx.fillText('YOU DIED', this.gameEngine.canvas.width / 2, this.gameEngine.canvas.height / 2)
    }

    ctx.restore()

    // Render buildings
    this.buildings.forEach(building => {
      building.render(ctx)
    })

    // Render entities (but skip player and NPCs since we handle them separately)
    // We need to manually render other entities, but skip player and NPCs
    const playerRef = this.player
    this.entities.forEach(entity => {
      // Skip player, NPCs (they have attackFrames and are rendered manually), and entities with individual images
      if (entity !== playerRef && entity.visible && !entity.images && !entity.attackFrames) {
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

    // Draw building interaction popup (screen space)
    if (this.nearbyBuilding) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      
      // Calculate popup position (above the building, adjusted for camera)
      const popupX = this.nearbyBuilding.x + this.nearbyBuilding.width / 2 - this.gameEngine.camera.x
      const popupY = this.nearbyBuilding.y - 40 - this.gameEngine.camera.y
      
      // Draw popup background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 2
      
      const text = this.nearbyBuilding.name
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      const textWidth = ctx.measureText(text).width
      const padding = 10
      
      ctx.fillRect(
        popupX - textWidth / 2 - padding,
        popupY - 20,
        textWidth + padding * 2,
        30
      )
      ctx.strokeRect(
        popupX - textWidth / 2 - padding,
        popupY - 20,
        textWidth + padding * 2,
        30
      )
      
          // Draw building name and interaction hint
          ctx.fillStyle = '#a78bfa'
          ctx.fillText(text, popupX, popupY)
          
          // Show special message for Shop during night
          if (this.nearbyBuilding.name === 'Shop' && this.gameState.worldState.time_of_day === 'Night') {
            ctx.font = '12px monospace'
            ctx.fillStyle = '#34d399'
            ctx.fillText('Press E to open shop', popupX, popupY + 20)
          } else if (this.nearbyBuilding.name === 'Shop' && this.gameState.worldState.time_of_day === 'Day') {
            ctx.font = '12px monospace'
            ctx.fillStyle = '#fca5a5'
            ctx.fillText('Closed - Opens at night', popupX, popupY + 20)
          }
          
          ctx.restore()
        }

    // Draw ingredient collection popup (screen space) - highest priority
    if (this.nearbyIngredient && !this.nearbyIngredient.collected) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      
      // Calculate popup position (above the ingredient, adjusted for camera)
      const popupX = this.nearbyIngredient.x + this.nearbyIngredient.width / 2 - this.gameEngine.camera.x
      const popupY = this.nearbyIngredient.y - 50 - this.gameEngine.camera.y
      
      const ingredientDisplay = INGREDIENT_DISPLAY[this.nearbyIngredient.ingredientType] || {
        name: this.nearbyIngredient.ingredientType,
        emoji: '🌿'
      }
      
      // Draw popup background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
      ctx.strokeStyle = '#10b981' // Green color for ingredient popups
      ctx.lineWidth = 2
      
      const text = `${ingredientDisplay.emoji} ${ingredientDisplay.name}`
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      const textWidth = ctx.measureText(text).width
      const padding = 10
      
      ctx.fillRect(
        popupX - textWidth / 2 - padding,
        popupY - 35,
        textWidth + padding * 2,
        50
      )
      ctx.strokeRect(
        popupX - textWidth / 2 - padding,
        popupY - 35,
        textWidth + padding * 2,
        50
      )
      
      // Draw ingredient name
      ctx.fillStyle = '#34d399' // Light green color for ingredient text
      ctx.fillText(text, popupX, popupY - 10)
      
      // Draw instruction
      ctx.font = '12px monospace'
      ctx.fillStyle = '#a7f3d0'
      ctx.fillText('Press E to collect', popupX, popupY + 10)
      
      ctx.restore()
    }

    // Draw biome name popup (screen space) - only if no ingredient nearby
    if (this.nearbyBiome && !this.nearbyIngredient) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      
      // Calculate popup position (above the biome center, adjusted for camera)
      const popupX = this.nearbyBiome.x + this.nearbyBiome.width / 2 - this.gameEngine.camera.x
      const popupY = this.nearbyBiome.y - 40 - this.gameEngine.camera.y
      
      // Draw popup background (different color from building popup)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.strokeStyle = '#60a5fa' // Blue color for biome popups
      ctx.lineWidth = 2
      
      const text = this.nearbyBiome.name
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      const textWidth = ctx.measureText(text).width
      const padding = 10
      
      ctx.fillRect(
        popupX - textWidth / 2 - padding,
        popupY - 20,
        textWidth + padding * 2,
        30
      )
      ctx.strokeRect(
        popupX - textWidth / 2 - padding,
        popupY - 20,
        textWidth + padding * 2,
        30
      )
      
      // Draw biome name
      ctx.fillStyle = '#93c5fd' // Light blue color for biome text
      ctx.fillText(text, popupX, popupY)
      
      ctx.restore()
    }

    // Draw instructions (screen space)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('WASD/Arrows - Move', 20, this.gameEngine.canvas.height - 80)
    ctx.fillText('Press E - Interact with building', 20, this.gameEngine.canvas.height - 60)
    ctx.fillText('Press I - Open Inventory', 20, this.gameEngine.canvas.height - 40)
    ctx.fillText('Gather ingredients and avoid humans!', 20, this.gameEngine.canvas.height - 20)
    ctx.restore()
  }

  /**
   * Get building by name (useful for later interactions)
   */
  getBuildingByName(name) {
    return this.buildings.find(building => building.name === name)
  }

  /**
   * Get all building coordinates (useful for game state/Dojo integration)
   */
  getBuildingCoords() {
    const coords = {}
    this.buildings.forEach(building => {
      coords[building.name] = building.coords
    })
    return coords
  }

  /**
   * Get all biome coordinates (useful for game state/Dojo integration)
   */
  getBiomeCoords() {
    const coords = {}
    this.biomes.forEach(biome => {
      coords[biome.name] = biome.coords
    })
    return coords
  }

  /**
   * Get biome by name (useful for later interactions)
   */
  getBiomeByName(name) {
    return this.biomes.find(biome => biome.name === name)
  }

  /**
   * Get biome by zone type (aligned with Dojo ZoneType enum)
   */
  getBiomeByZoneType(zoneType) {
    return this.biomes.find(biome => biome.zoneType === zoneType)
  }

  /**
   * Collect an ingredient and add it to inventory
   */
  collectIngredient(ingredient) {
    if (ingredient.collected) return

    ingredient.collected = true
    ingredient.visible = false

    // Update game state inventory
    const currentInventory = this.gameState.ingredientItems || []
    
    // Check if player already has this ingredient type
    const existingItem = currentInventory.find(
      item => item.ingredient_type === ingredient.ingredientType
    )

    if (existingItem) {
      // Increment quantity
      existingItem.quantity += 1
    } else {
      // Add new ingredient item
      const newItem = {
        owner: this.gameState.player.addr || 'player',
        slot: currentInventory.length,
        ingredient_type: ingredient.ingredientType,
        quantity: 1
      }
      currentInventory.push(newItem)
    }

    // Update inventory count
    const inventoryCount = currentInventory.reduce((sum, item) => sum + item.quantity, 0)
    
    // Update game state
    this.setGameState(prev => ({
      ...prev,
      ingredientItems: currentInventory,
      inventory: {
        ...prev.inventory,
        count: inventoryCount
      }
    }))

    const ingredientDisplay = INGREDIENT_DISPLAY[ingredient.ingredientType] || {
      name: ingredient.ingredientType,
      emoji: '🌿'
    }

    console.log(`✅ Collected: ${ingredientDisplay.emoji} ${ingredientDisplay.name}`)
    console.log(`📦 Inventory: ${inventoryCount} items`)
  }
}

