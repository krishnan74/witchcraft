# 🚀 Quick Start Guide

## Step 1: Run the Game (Test It First!)

```bash
cd client
npm run dev
```

Then open your browser to `http://localhost:3000`

**What you'll see:**
- A purple-themed game canvas
- Shop scene (day mode) - basic UI
- Stats bar showing Day, Time, Gold

**Try it:**
- Press **E** to switch to Exploration mode
- Press **WASD** or **Arrow Keys** to move the purple square (player)
- Press **E** again to go back to Shop

## Step 2: Add Your Sprite Sheets

### Where to put sprites:
```
client/
  public/
    sprites/
      player.png        ← Player sprite sheet
      ingredients.png   ← Ingredient items
      shop.png          ← Shop tiles/background
      monsters.png      ← Customer sprites
      etc.
```

### How to load sprites:

1. **In your scene** (e.g., `src/scenes/ExplorationScene.js`), add to `onEnter()`:

```javascript
async onEnter() {
  // Load player sprite sheet
  await spriteManager.loadSpriteSheet(
    'player',              // Name to reference it
    '/sprites/player.png', // Path in public folder
    32,                    // Width of each frame
    32,                    // Height of each frame
    {
      animations: {
        idle: { 
          frames: [0],           // Frame indices
          frameDuration: 100     // ms per frame
        },
        walk: { 
          frames: [1, 2, 3, 4],  // Walking animation frames
          frameDuration: 150 
        }
      }
    }
  )
  
  // Assign to player entity
  if (this.player) {
    this.player.sprite = 'player'  // Use the name you registered
    this.player.currentAnimation = 'idle'
  }
}
```

2. **Sprite sheet format:**
   - Grid layout (frames arranged in rows/columns)
   - Each frame should be the same size
   - Example: 128x128 image with 4 frames = 32x32 per frame

## Step 3: Build Out Features

### Priority order:
1. ✅ Get it running (you're here!)
2. ⬜ Add player sprite and animations
3. ⬜ Add ingredient sprites for gathering
4. ⬜ Add shop UI sprites (cauldrons, customers)
5. ⬜ Implement ingredient gathering mechanics
6. ⬜ Add brewing/crafting system
7. ⬜ Connect to Dojo contracts

## Tips

- **Sprite sheet tool**: Use Aseprite, Pyxel Edit, or Photoshop to create sprite sheets
- **Free resources**: Itch.io has free sprite packs you can use for prototyping
- **Testing**: The game works without sprites (uses colored rectangles) - you can add sprites incrementally
- **Performance**: Keep sprite sheets organized by scene/type for better loading

## Next: Integrate with Dojo

Once sprites are working, your friend can connect the game state to Dojo:
- Update `src/hooks/useDojo.js` with Starknet/Dojo provider
- Connect game actions (gather, brew, sell) to contract calls
- Sync state from blockchain

