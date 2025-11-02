import { useState, useEffect } from 'react'
import { getRecipeForDay, RECIPES, INGREDIENT_DISPLAY, POTION_EFFECT_DISPLAY } from '../data/recipes'
import './CauldronPopup.css'

/**
 * Cauldron Popup Component
 * Allows player to brew potions using collected ingredients
 * Structured to align with Dojo brewing_system.cairo
 * Shows all recipes unlocked up to current day
 */
export default function CauldronPopup({ 
  isOpen, 
  onClose, 
  currentDay, 
  ingredientItems, 
  onStartBrew 
}) {
  const [brewing, setBrewing] = useState(false)
  const [brewProgress, setBrewProgress] = useState(0)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [brewingRecipe, setBrewingRecipe] = useState(null)

  // Get all recipes unlocked up to current day (Days 1 through currentDay)
  const unlockedRecipes = RECIPES.slice(0, currentDay || 1)
  
  // Default to current day's recipe if none selected
  const displayRecipe = selectedRecipe || unlockedRecipes[unlockedRecipes.length - 1] || getRecipeForDay(currentDay || 1)
  const effectDisplay = POTION_EFFECT_DISPLAY[displayRecipe.effect] || { name: displayRecipe.effect, emoji: '🧪' }
  
  // If brewing, use the brewing recipe instead
  const activeRecipe = brewingRecipe || displayRecipe

  // Check if player has required ingredients for a specific recipe
  const checkIngredients = (recipe) => {
    const hasIngredients = recipe.ingredients.every(req => {
      const owned = ingredientItems.find(item => item.ingredient_type === req.ingredient_type)
      const ownedQty = owned ? owned.quantity : 0
      return ownedQty >= req.quantity
    })
    return hasIngredients
  }

  const hasRequiredIngredients = checkIngredients(activeRecipe)
  
  // Reset selection when popup closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRecipe(null)
      setBrewingRecipe(null)
      setBrewing(false)
      setBrewProgress(0)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !brewing) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, brewing])

  // Simulate brewing progress (for client-side simulation)
  // In Dojo, this will check block_number >= brewing_until instead
  useEffect(() => {
    if (brewing && brewingRecipe) {
      const duration = brewingRecipe.base_time * 1000 // Convert to milliseconds
      const interval = 100 // Update every 100ms
      let elapsed = 0

      const timer = setInterval(() => {
        elapsed += interval
        const progress = Math.min((elapsed / duration) * 100, 100)
        setBrewProgress(progress)

        if (progress >= 100) {
          clearInterval(timer)
          // Brewing complete - parent will handle potion creation and close popup
          setBrewing(false)
          setBrewProgress(0)
          setBrewingRecipe(null)
          // Don't close popup here - let parent handle it after potion is created
        }
      }, interval)

      return () => clearInterval(timer)
    } else {
      // Reset progress when brewing stops
      setBrewProgress(0)
    }
  }, [brewing, brewingRecipe])

  const handleStartBrew = () => {
    if (!hasRequiredIngredients || brewing || !activeRecipe) return
    
    setBrewing(true)
    setBrewProgress(0)
    setBrewingRecipe(activeRecipe)
    
    // Call parent handler (will consume ingredients and start brewing)
    // This triggers the brewing process which will eventually close the popup
    if (onStartBrew) {
      onStartBrew(activeRecipe)
    }
  }
  
  const handleRecipeSelect = (recipe) => {
    if (!brewing) {
      setSelectedRecipe(recipe)
    }
  }

  if (!isOpen) return null

  return (
    <div className="cauldron-overlay" onClick={!brewing ? onClose : undefined}>
      <div className="cauldron-popup" onClick={(e) => e.stopPropagation()}>
        <div className="cauldron-header">
          <h2>🧪 Cauldron</h2>
          {!brewing && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>

        {/* Recipe Selection */}
        {unlockedRecipes.length > 1 && !brewing && (
          <div className="recipe-selection">
            <h4>Select Recipe to Brew:</h4>
            <div className="recipes-list">
              {unlockedRecipes.map((recipe, index) => {
                const dayNum = index + 1
                const isSelected = selectedRecipe?.recipe_id === recipe.recipe_id || (!selectedRecipe && dayNum === currentDay)
                const canBrew = checkIngredients(recipe)
                
                return (
                  <button
                    key={recipe.recipe_id}
                    className={`recipe-option ${isSelected ? 'selected' : ''} ${canBrew ? 'can-brew' : 'cannot-brew'}`}
                    onClick={() => handleRecipeSelect(recipe)}
                  >
                    <span className="recipe-day">Day {dayNum}</span>
                    <span className="recipe-name">{recipe.name}</span>
                    {canBrew ? '✅' : '❌'}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Current Recipe */}
        <div className="recipe-section">
          <div className="recipe-title">
            <span className="potion-emoji">{effectDisplay.emoji}</span>
            <h3>Day {unlockedRecipes.findIndex(r => r.recipe_id === activeRecipe.recipe_id) + 1}: {activeRecipe.name}</h3>
          </div>

          <div className="recipe-info">
            <div className="info-row">
              <span className="info-label">Effect:</span>
              <span className="info-value">{effectDisplay.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Difficulty:</span>
              <span className="info-value">
                {'⭐'.repeat(activeRecipe.difficulty)}
                {'☆'.repeat(5 - activeRecipe.difficulty)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Brewing Time:</span>
              <span className="info-value">{Math.floor(activeRecipe.base_time / 60)}m {activeRecipe.base_time % 60}s</span>
            </div>
            <div className="info-row">
              <span className="info-label">Value:</span>
              <span className="info-value">💰 {activeRecipe.base_value} gold</span>
            </div>
          </div>
        </div>

        {/* Required Ingredients */}
        <div className="ingredients-section">
          <h4>Required Ingredients:</h4>
          <div className="ingredients-list">
            {activeRecipe.ingredients.map((req, index) => {
              const ingDisplay = INGREDIENT_DISPLAY[req.ingredient_type] || {
                name: req.ingredient_type,
                emoji: '🌿',
                zone: 'Unknown'
              }
              const owned = ingredientItems.find(item => item.ingredient_type === req.ingredient_type)
              const ownedQty = owned ? owned.quantity : 0
              const hasEnough = ownedQty >= req.quantity

              return (
                <div key={index} className={`ingredient-requirement ${hasEnough ? 'has-enough' : 'missing'}`}>
                  <div className="ingredient-icon">{ingDisplay.emoji}</div>
                  <div className="ingredient-details">
                    <div className="ingredient-name">{ingDisplay.name}</div>
                    <div className="ingredient-quantity">
                      {ownedQty} / {req.quantity}
                    </div>
                  </div>
                  <div className="requirement-status">
                    {hasEnough ? '✅' : '❌'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Brewing Progress */}
        {brewing && (
          <div className="brewing-progress">
            <div className="progress-label">Brewing in progress...</div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${brewProgress}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(brewProgress)}%</div>
          </div>
        )}

        {/* Brew Button */}
        {!brewing && (
          <div className="brew-actions">
            <button
              className={`brew-btn ${hasRequiredIngredients ? 'enabled' : 'disabled'}`}
              onClick={handleStartBrew}
              disabled={!hasRequiredIngredients}
            >
              {hasRequiredIngredients ? '⚗️ Start Brewing' : '❌ Missing Ingredients'}
            </button>
            {!hasRequiredIngredients && (
              <div className="hint-text">
                Collect all required ingredients to start brewing
              </div>
            )}
          </div>
        )}

        <div className="cauldron-footer">
          <div className="hint">
            {brewing ? 'Brewing... Please wait' : 'Press ESC to close'}
          </div>
        </div>
      </div>
    </div>
  )
}

