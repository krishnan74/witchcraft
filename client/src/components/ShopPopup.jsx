import { useState, useEffect } from 'react'
import { getRecipeForDay, RECIPES, POTION_EFFECT_DISPLAY } from '../data/recipes'
import { FACTION_DISPLAY, findMatchingPotion, fulfillOrder } from '../utils/shopSystem'
import { formatTimeRemaining } from '../utils/dayNightCycle'
import './ShopPopup.css'

/**
 * Shop Popup Component
 * Displays customer orders and allows selling potions
 * Structured to align with Dojo Customer and Order models
 * Shows orders for all unlocked recipes (Days 1 through current day)
 */
export default function ShopPopup({ 
  isOpen, 
  onClose, 
  currentDay,
  orders,
  potions,
  timeRemaining,
  onSellPotion
}) {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterRecipe, setFilterRecipe] = useState(null) // Filter by recipe type

  // Get all unlocked recipes up to current day
  const unlockedRecipes = RECIPES.slice(0, currentDay || 1)
  
  // Get orders for filtered recipe, or all orders if no filter
  const filteredOrders = filterRecipe 
    ? orders.filter(order => order.recipe_id === filterRecipe.recipe_id)
    : orders

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

  const handleSellPotion = (order) => {
    if (!order || order.fulfilled) return
    
    // Find matching potion
    const matchingPotion = findMatchingPotion(order, potions || [])
    
    if (!matchingPotion) {
      alert('You don\'t have a matching potion for this order!')
      return
    }
    
    // Fulfill order
    const result = fulfillOrder(order, matchingPotion)
    
    if (result.success && onSellPotion) {
      onSellPotion(result)
      setSelectedOrder(null)
    }
  }

  const availableOrders = orders?.filter(order => !order.fulfilled) || []
  const fulfilledOrders = orders?.filter(order => order.fulfilled) || []
  const totalEarnings = fulfilledOrders.reduce((sum, order) => sum + order.price, 0)

  if (!isOpen) return null

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-popup" onClick={(e) => e.stopPropagation()}>
        <div className="shop-header">
          <h2>🌙 Night Shop - Day {currentDay}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Time Remaining */}
        <div className="time-remaining">
          <span className="time-label">Night Time Remaining:</span>
          <span className="time-value">{formatTimeRemaining(timeRemaining)}</span>
        </div>

        {/* Recipe Filter (if multiple unlocked) */}
        {unlockedRecipes.length > 1 && (
          <div className="recipe-filter">
            <div className="filter-label">Filter by Recipe:</div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${!filterRecipe ? 'active' : ''}`}
                onClick={() => setFilterRecipe(null)}
              >
                All Recipes
              </button>
              {unlockedRecipes.map((recipe, index) => {
                const dayNum = index + 1
                const recipeOrders = orders.filter(o => o.recipe_id === recipe.recipe_id && !o.fulfilled)
                const effectDisplay = POTION_EFFECT_DISPLAY[recipe.effect] || { name: recipe.effect, emoji: '🧪' }
                
                return (
                  <button
                    key={recipe.recipe_id}
                    className={`filter-btn ${filterRecipe?.recipe_id === recipe.recipe_id ? 'active' : ''}`}
                    onClick={() => setFilterRecipe(recipe)}
                  >
                    Day {dayNum}: {recipe.name} ({recipeOrders.length})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="day-recipe">
          <div className="recipe-title">
            <span>🌙 Night Shop - Day {currentDay}</span>
          </div>
          <div className="recipe-hint">
            {filterRecipe 
              ? `Showing orders for: Day ${unlockedRecipes.findIndex(r => r.recipe_id === filterRecipe.recipe_id) + 1} - ${filterRecipe.name}`
              : `Customers want potions from all unlocked recipes (Days 1-${currentDay})!`}
          </div>
        </div>

        {/* Available Orders */}
        <div className="orders-section">
          <h3>Customer Orders ({filteredOrders.filter(o => !o.fulfilled).length})</h3>
          {filteredOrders.filter(o => !o.fulfilled).length > 0 ? (
            <div className="orders-list">
              {filteredOrders.filter(o => !o.fulfilled).map((order, index) => {
                const factionDisplay = FACTION_DISPLAY[order.faction] || { name: order.faction, emoji: '👤' }
                const hasMatchingPotion = findMatchingPotion(order, potions || []) !== null
                const orderRecipe = unlockedRecipes.find(r => r.recipe_id === order.recipe_id) || getRecipeForDay(1)
                const recipeEffectDisplay = POTION_EFFECT_DISPLAY[orderRecipe.effect] || { name: orderRecipe.effect, emoji: '🧪' }

                return (
                  <div 
                    key={order.order_id} 
                    className={`order-item ${hasMatchingPotion ? 'can-fulfill' : 'no-potion'} ${selectedOrder?.order_id === order.order_id ? 'selected' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="order-faction">
                      <span className="faction-emoji">{factionDisplay.emoji}</span>
                      <span className="faction-name">{factionDisplay.name}</span>
                    </div>
                    <div className="order-details">
                      <div className="order-recipe">
                        <span className="recipe-emoji">{recipeEffectDisplay.emoji}</span>
                        <span>Day {order.recipe_day || '?'}: {order.recipe_name || orderRecipe.name}</span>
                      </div>
                      <div className="order-price">💰 {order.price} gold</div>
                    </div>
                    <div className="order-status">
                      {hasMatchingPotion ? (
                        <button 
                          className="sell-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSellPotion(order)
                          }}
                        >
                          Sell Potion
                        </button>
                      ) : (
                        <span className="no-potion-badge">No Matching Potion</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="no-orders">
              {fulfilledOrders.length > 0 
                ? filterRecipe 
                  ? `All ${filterRecipe.name} orders fulfilled! 🌟`
                  : 'All orders fulfilled! 🌟' 
                : 'No orders available'}
            </div>
          )}
        </div>

        {/* Fulfilled Orders Summary */}
        {fulfilledOrders.length > 0 && (
          <div className="fulfilled-section">
            <h4>Fulfilled Orders: {fulfilledOrders.length}</h4>
            <div className="total-earnings">
              Total Earnings: 💰 {totalEarnings} gold
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="shop-footer">
          <div className="hint">
            Click on an order and click "Sell Potion" to fulfill it
          </div>
          <div className="hint">
            Press ESC to close
          </div>
        </div>
      </div>
    </div>
  )
}

