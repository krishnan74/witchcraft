# Sprites Directory

Place your sprite sheets here!

## Player Sprite

**File:** `player.png`

**Format:**
- Sprite sheet with frames arranged in a row
- Frame size: 32x32 pixels each
- At least 5 frames: [idle, walk1, walk2, walk3, walk4]
- Recommended: 128x32 pixels (4 walk frames + 1 idle) or 160x32 (5 frames total)

**Example Layout:**
```
[Idle] [Walk1] [Walk2] [Walk3] [Walk4]
 32px   32px    32px    32px    32px
```

Or if you have separate idle frames:
```
[Idle] [Walk1] [Walk2] [Walk3] [Walk4] [Walk1] [Walk2] [Walk3] [Walk4]
```

## Where to Get Sprites

- **Free resources:** [itch.io](https://itch.io/game-assets/free/tag-pixel-art)
- **Paid assets:** [Unity Asset Store](https://assetstore.unity.com/), [GameDev Market](https://www.gamedevmarket.net/)
- **Create your own:** Use [Aseprite](https://www.aseprite.org/), [Piskel](https://www.piskelapp.com/), or [Photoshop](https://www.adobe.com/products/photoshop.html)

## Current Configuration

The game expects:
- **Path:** `/sprites/player.png`
- **Frame size:** 32x32 pixels
- **Animations:**
  - `idle`: Frame 0
  - `walk`: Frames 1, 2, 3, 4 (looping)

You can modify the animation configuration in `src/scenes/ExplorationScene.js` if your sprite sheet is different.

