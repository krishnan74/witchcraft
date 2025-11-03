# Routing Guide

The application now uses React Router for navigation between different pages.

## 🗺️ Routes

### `/` - Game View (Main Page)
- **URL**: http://localhost:3000/
- **Description**: Main game canvas with gameplay
- **Features**:
  - Game canvas rendering
  - Wallet connect
  - Navigation links to Dashboard and Admin
  - Spawn player button
  - Game UI overlays (stats, inventory, etc.)

### `/dashboard` - Dashboard Page
- **URL**: http://localhost:3000/dashboard
- **Description**: Combined dashboard with all game systems and MVP test flow
- **Features**:
  - **Overview Tab**: Displays player stats, position, inventory, progression, potions, and faction reputation
  - **Actions Tab**: Interactive buttons for all game actions (spawn, move, forage, brew, etc.)
  - **MVP Test Flow Tab**: Complete automated test flow with activity logs
  - Wallet connect component
  - Navigation to Game and Admin pages

### `/admin` - Admin Panel
- **URL**: http://localhost:3000/admin
- **Description**: Game manager/admin tools for creating game models
- **Features**:
  - Create combat entities
  - Create creature loot tables
  - Create craft recipes and ingredients
  - Create zones
  - Create potion recipes and ingredients
  - Create customers
  - Wallet connect component
  - Navigation to Game and Dashboard pages

## 🎨 Design Features

### Dashboard Page
- **Clean Layout**: Three-tab interface for easy navigation
- **Overview Cards**: Grid layout showing all player data at a glance
- **Action Buttons**: Organized by system (Core, Brewing, Combat, etc.)
- **MVP Test Flow**: Automated testing with real-time logs
- **Color-Coded Sections**: 
  - Blue for navigation/stats
  - Green for core actions
  - Purple for brewing
  - Orange for combat/systems

### Admin Panel
- **Professional Header**: Clear title with navigation
- **Form-Based Interface**: Easy-to-use forms for each admin function
- **Validation**: Input validation and error handling
- **Red Accent**: Distinguishes admin functions from game features

## 🔗 Navigation

Navigation links are available on all pages:
- **Dashboard** button (green) - Goes to `/dashboard`
- **Admin** button (red) - Goes to `/admin`
- **Back to Game** / **Game View** button (blue) - Goes to `/`

## 📁 File Structure

```
client/src/
├── pages/
│   ├── DashboardPage.tsx    # Combined dashboard
│   └── AdminPage.tsx        # Admin panel page
├── components/
│   ├── AdminPanel.tsx       # Admin panel UI (used in AdminPage)
│   ├── MvpTestFlow.tsx      # MVP test flow (integrated into Dashboard)
│   └── NewSystemsDemo.tsx   # New systems demo (integrated into Dashboard)
└── App.jsx                  # Main app with routing setup
```

## 🚀 Usage

1. **Game View** (`/`): Play the game normally
2. **Dashboard** (`/dashboard`): Test systems, view stats, run MVP flow
3. **Admin** (`/admin`): Create game content (entities, recipes, zones, etc.)

All pages have wallet connect functionality and can interact with the Dojo backend.

## 💡 Tips

- Use the Dashboard to test all game systems in one place
- Use the Admin panel to set up game content before players interact
- The MVP Test Flow tab runs the complete game loop automatically
- Activity logs show real-time feedback for all actions

