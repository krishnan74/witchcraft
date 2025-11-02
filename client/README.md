# 🧪 Witch's Brew: War for the Cauldron - Client

React + Vite client for the Witch's Brew game using Canvas and sprite sheets.

## Features

- **Canvas-based rendering** for game graphics
- **Sprite sheet system** for efficient asset loading and animation
- **Scene management** for different game modes (Shop, Exploration)
- **Entity system** for game objects
- **Game loop** with delta time for smooth animations
- **Input handling** for keyboard and mouse

## Setup

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── engine/
│   ├── GameEngine.js       # Core game loop and rendering
│   ├── SpriteManager.js    # Sprite sheet loading and rendering
│   ├── SceneManager.js     # Scene management
│   └── Entity.js           # Base entity class
├── scenes/
│   ├── BaseScene.js        # Base scene class
│   ├── ShopScene.js        # Daytime shop management
│   └── ExplorationScene.js # Nighttime exploration
├── components/
│   └── GameCanvas.jsx      # React canvas component
├── App.jsx                 # Main app component
└── main.jsx               # Entry point
```

## Game Loop

1. **Day (Shop)**: Manage cauldrons, brew potions, serve customers
2. **Night (Exploration)**: Gather ingredients, avoid humans, collect resources
3. **Integration**: Connect with Dojo/Starknet for blockchain game state

## Adding Sprite Sheets

```javascript
import { spriteManager } from './engine/SpriteManager'

// Load a sprite sheet
await spriteManager.loadSpriteSheet(
  'player',              // name
  '/sprites/player.png', // path
  32,                    // frame width
  32,                    // frame height
  {
    animations: {
      idle: { frames: [0], frameDuration: 100 },
      walk: { frames: [1, 2, 3, 4], frameDuration: 150 }
    }
  }
)

// Use in entity
entity.sprite = spriteManager.getSpriteSheet('player')
entity.currentAnimation = 'idle'
```

## Controls

- **WASD / Arrow Keys**: Move player (in exploration)
- **E**: Switch between shop and exploration
- **B**: Open brewing menu (coming soon)

## Integration with Dojo

The game state is managed in `App.jsx` and can be easily connected to Dojo contracts:
- `gameState` - Current game state (day, time, resources, reputation)
- `setGameState` - Function to update game state (will connect to Dojo)

See `src/hooks/useDojo.js` for the integration hook (to be implemented).

## Quick Start

1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Open browser to `http://localhost:3000`

## Adding Sprite Sheets

1. Place sprite sheet images in `public/sprites/`
2. Load them in your scene's `onEnter()` method:

```javascript
await spriteManager.loadSpriteSheet(
  'mySprite',
  '/sprites/mysprite.png',
  32, 32,
  {
    animations: {
      idle: { frames: [0], frameDuration: 100 },
      walk: { frames: [1, 2, 3, 4], frameDuration: 150 }
    }
  }
)
```

3. Use in entities:

```javascript
entity.sprite = spriteManager.getSpriteSheet('mySprite')
entity.currentAnimation = 'idle'
```

## Next Steps

- [ ] Add sprite sheets for characters, items, and environments
- [ ] Implement ingredient gathering mechanics
- [ ] Add brewing/crafting system
- [ ] Create customer/faction interaction system
- [ ] Integrate with Dojo contracts
- [ ] Add day/night cycle timer
- [ ] Implement human patrol AI
- [ ] Add inventory management UI

