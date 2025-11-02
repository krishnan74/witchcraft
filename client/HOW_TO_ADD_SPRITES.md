# 🎨 How to Add Your Player Sprite

## Quick Steps

1. **Create the sprites folder** (if it doesn't exist):
   ```
   client/public/sprites/
   ```

2. **Add your sprite image:**
   - Name it: `player.png`
   - Place it in: `client/public/sprites/player.png`

3. **Sprite Requirements:**
   - **Format:** PNG image (transparent background recommended)
   - **Frame size:** 32x32 pixels each
   - **Layout:** Frames in a horizontal row
   - **Minimum frames needed:**
     - Frame 0: Idle animation
     - Frames 1-4: Walking animation (4 frames)

4. **Example sprite sheet layout:**
   ```
   [Idle] [Walk1] [Walk2] [Walk3] [Walk4]
   32px   32px    32px    32px    32px
   Total width: 160px, Height: 32px
   ```

5. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## That's It! 🎉

Once you add `player.png` to the sprites folder, the game will automatically:
- ✅ Load the sprite when you enter Exploration mode
- ✅ Show idle animation when standing still
- ✅ Show walking animation when moving (WASD)
- ✅ Replace the purple placeholder square

## Customizing Animation Frames

If your sprite sheet is different, edit `src/scenes/ExplorationScene.js`:

```javascript
await spriteManager.loadSpriteSheet('player', '/sprites/player.png', 32, 32, {
  animations: {
    idle: { frames: [0], frameDuration: 100 },        // Change frame numbers
    walk: { frames: [1, 2, 3, 4], frameDuration: 150 } // Adjust speed or frames
  }
})
```

## Where to Get Free Sprites

- **[itch.io](https://itch.io/game-assets/free/tag-pixel-art)** - Tons of free pixel art
- **[OpenGameArt.org](https://opengameart.org/)** - Free game assets
- **[Pixabay](https://pixabay.com/)** - Free images (search "pixel art character")

## Testing Without a Sprite

The game will still work without a sprite - it shows a purple placeholder square. The sprite is optional for now!

