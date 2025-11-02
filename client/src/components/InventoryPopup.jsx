import { useState, useEffect } from 'react'
import { INGREDIENT_DISPLAY, POTION_EFFECT_DISPLAY } from '../data/recipes'
import './InventoryPopup.css'

/**
 * Inventory Popup Component
 * Displays player inventory aligned with Dojo models
 */
export default function InventoryPopup({ isOpen, onClose, inventory, ingredientItems, potions, player }) {
  const [selectedTab, setSelectedTab] = useState('ingredients') // 'ingredients' | 'potions'
  const [ingredientImages, setIngredientImages] = useState({})

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

  // Load ingredient images
  useEffect(() => {
    const loadImages = async () => {
      const loadedImages = {}
      for (const [type, path] of Object.entries(ingredientImageMap)) {
        try {
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = path
          })
          loadedImages[type] = img
        } catch (error) {
          console.warn(`Failed to load ingredient image: ${path}`)
        }
      }
      setIngredientImages(loadedImages)
    }
    
    if (isOpen) {
      loadImages()
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-popup" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>📦 Inventory</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Player Stats */}
        {player && (
          <div className="player-stats">
            <div className="stat-item">💰 Gold: {player.gold || 0}</div>
            <div className="stat-item">❤️ Health: {player.health || 100}</div>
            <div className="stat-item">⚡ Stamina: {player.stamina || 100}</div>
            <div className="stat-item">⭐ Reputation: {player.reputation || 0}</div>
          </div>
        )}

        {/* Inventory Capacity */}
        {inventory && (
          <div className="inventory-capacity">
            Capacity: {inventory.count || 0} / {inventory.capacity || 20}
          </div>
        )}

        {/* Tabs */}
        <div className="inventory-tabs">
          <button
            className={selectedTab === 'ingredients' ? 'active' : ''}
            onClick={() => setSelectedTab('ingredients')}
          >
            Ingredients
          </button>
          <button
            className={selectedTab === 'potions' ? 'active' : ''}
            onClick={() => setSelectedTab('potions')}
          >
            Potions
          </button>
        </div>

        {/* Content */}
        <div className="inventory-content">
          {selectedTab === 'ingredients' && (
            <div className="items-grid">
              {ingredientItems && ingredientItems.length > 0 ? (
                ingredientItems.map((item, index) => {
                  const ingredientDisplay = INGREDIENT_DISPLAY[item.ingredient_type] || {
                    name: item.ingredient_type,
                    emoji: '🌿'
                  }
                  const ingredientImage = ingredientImages[item.ingredient_type]
                  
                  return (
                    <div key={index} className="inventory-item">
                      <div className="item-icon">
                        {ingredientImage ? (
                          <img 
                            src={ingredientImage.src} 
                            alt={ingredientDisplay.name}
                            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                          />
                        ) : (
                          ingredientDisplay.emoji
                        )}
                      </div>
                      <div className="item-info">
                        <div className="item-name">
                          {ingredientDisplay.name}
                        </div>
                        <div className="item-quantity">Qty: {item.quantity || 0}</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-inventory">No ingredients yet</div>
              )}
            </div>
          )}

          {selectedTab === 'potions' && (
            <div className="items-grid">
              {potions && potions.length > 0 ? (
                potions.map((potion, index) => {
                  const effectDisplay = POTION_EFFECT_DISPLAY[potion.effect] || {
                    name: potion.effect,
                    emoji: '🧪'
                  }
                  
                  return (
                    <div key={index} className="inventory-item">
                      <div className="item-icon">{effectDisplay.emoji}</div>
                      <div className="item-info">
                        <div className="item-name">{effectDisplay.name}</div>
                        <div className="item-quantity">Quality: {potion.quality}%</div>
                        <div className="item-quantity">Value: 💰 {potion.value} gold</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-inventory">No potions yet</div>
              )}
            </div>
          )}
        </div>

        <div className="inventory-footer">
          <div className="hint">Press ESC or click outside to close</div>
        </div>
      </div>
    </div>
  )
}

