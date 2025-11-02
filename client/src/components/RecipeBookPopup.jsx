import { useState, useEffect } from 'react'
import { getRecipeForDay, INGREDIENT_DISPLAY, POTION_EFFECT_DISPLAY } from '../data/recipes'
import './RecipeBookPopup.css'

/**
 * Recipe Book Popup Component
 * Shows the current day's recipe and required ingredients
 * Aligned with Dojo Recipe and RecipeIngredient models
 */
export default function RecipeBookPopup({ isOpen, onClose, currentDay }) {
  const [selectedDay, setSelectedDay] = useState(currentDay || 1)

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

  const recipe = getRecipeForDay(selectedDay)
  const effectDisplay = POTION_EFFECT_DISPLAY[recipe.effect] || { name: recipe.effect, emoji: '🧪' }

  return (
    <div className="recipe-book-overlay" onClick={onClose}>
      <div className="recipe-book-popup" onClick={(e) => e.stopPropagation()}>
        <div className="recipe-book-header">
          <h2>📖 Recipe Book</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Day Selector */}
        <div className="day-selector">
          <span className="day-label">Day:</span>
          <div className="day-buttons">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <button
                key={day}
                className={`day-btn ${selectedDay === day ? 'active' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Current Day Highlight */}
        {currentDay && (
          <div className="current-day-banner">
            📅 Today is Day {currentDay} - This is the potion you need to brew!
          </div>
        )}

        {/* Recipe Content */}
        <div className="recipe-content">
          <div className="recipe-title">
            <span className="potion-emoji">{effectDisplay.emoji}</span>
            <h3>{recipe.name}</h3>
          </div>

          <div className="recipe-info">
            <div className="info-row">
              <span className="info-label">Effect:</span>
              <span className="info-value">{effectDisplay.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Difficulty:</span>
              <span className="info-value">
                {'⭐'.repeat(recipe.difficulty)}
                {'☆'.repeat(5 - recipe.difficulty)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Brewing Time:</span>
              <span className="info-value">{Math.floor(recipe.base_time / 60)}m {recipe.base_time % 60}s</span>
            </div>
            <div className="info-row">
              <span className="info-label">Value:</span>
              <span className="info-value">💰 {recipe.base_value} gold</span>
            </div>
          </div>

          {/* Required Ingredients */}
          <div className="ingredients-section">
            <h4>Required Ingredients:</h4>
            <div className="ingredients-list">
              {recipe.ingredients.map((ing, index) => {
                const ingDisplay = INGREDIENT_DISPLAY[ing.ingredient_type] || {
                  name: ing.ingredient_type,
                  emoji: '🌿',
                  zone: 'Unknown'
                }
                return (
                  <div key={index} className="ingredient-item">
                    <div className="ingredient-icon">{ingDisplay.emoji}</div>
                    <div className="ingredient-details">
                      <div className="ingredient-name">{ingDisplay.name}</div>
                      <div className="ingredient-quantity">Qty: {ing.quantity}</div>
                      <div className="ingredient-zone">📍 Found in: {ingDisplay.zone}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="recipe-instructions">
            <p>
              <strong>How to complete:</strong><br />
              1. Collect all required ingredients from their biomes during the day<br />
              2. Return to the Cauldron to brew the potion<br />
              3. Sell the potion in the Shop at night to complete the day
            </p>
          </div>
        </div>

        <div className="recipe-book-footer">
          <div className="hint">Press ESC or click outside to close</div>
        </div>
      </div>
    </div>
  )
}

