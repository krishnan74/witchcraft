/**
 * Shop System - Client-side implementation
 * Structured to align with Dojo Customer and Order models for easy integration
 * 
 * In Dojo integration, these will call contract methods:
 * - generate_customer_orders(day)
 * - fulfill_order(order_id, potion_id)
 */

import { getRecipeForDay } from '../data/recipes'

/**
 * Faction display names and emojis
 */
export const FACTION_DISPLAY = {
  Demon: { name: 'Demon', emoji: '👹' },
  Zombie: { name: 'Zombie', emoji: '🧟' },
  Vampire: { name: 'Vampire', emoji: '🧛' },
  Ghost: { name: 'Ghost', emoji: '👻' },
  HumanHunter: { name: 'Human Hunter', emoji: '🏹' }
}

/**
 * Generate random customer orders for all unlocked recipes (up to current day)
 * Aligned with Dojo Customer and Order models
 * 
 * @param {number} day - Current day (1-7)
 * @param {number} minOrders - Minimum number of orders per recipe (default: 1)
 * @param {number} maxOrders - Maximum number of orders per recipe (default: 3)
 * @returns {Array} Array of order objects
 */
export function generateCustomerOrders(day, minOrders = 1, maxOrders = 3) {
  // Get all recipes unlocked up to current day (Days 1 through day)
  const unlockedRecipes = []
  for (let d = 1; d <= day; d++) {
    unlockedRecipes.push(getRecipeForDay(d))
  }
  
  const factions = ['Demon', 'Zombie', 'Vampire', 'Ghost', 'HumanHunter']
  const orders = []
  
  // Generate orders for each unlocked recipe
  for (const recipe of unlockedRecipes) {
    // More orders for current day's recipe, fewer for older recipes
    const isCurrentDay = recipe.recipe_id === getRecipeForDay(day).recipe_id
    const numOrders = isCurrentDay 
      ? Math.floor(Math.random() * (maxOrders * 2 - minOrders + 1)) + minOrders // 1-6 for current day
      : Math.floor(Math.random() * (maxOrders - minOrders + 1)) + minOrders // 1-3 for older recipes
    
    for (let i = 0; i < numOrders; i++) {
      const orderId = `order_${recipe.recipe_id}_${i}_${Date.now()}`
      const buyerId = `customer_${factions[Math.floor(Math.random() * factions.length)]}_${i}`
      
      // Price varies based on a random multiplier (80% to 150% of base value)
      const priceMultiplier = 0.8 + Math.random() * 0.7
      const price = Math.floor(recipe.base_value * priceMultiplier)
      
      // Deadline is at end of night (1 minute from now in client, but in Dojo it's epoch-based)
      const deadlineEpoch = Date.now() + 60000 // End of night time
      
      orders.push({
        order_id: orderId,
        buyer_id: buyerId,
        recipe_id: recipe.recipe_id,
        preferred_recipe: recipe.recipe_id, // Customer wants this recipe's potion
        price: price,
        deadline_epoch: deadlineEpoch,
        fulfilled: false,
        faction: factions[Math.floor(Math.random() * factions.length)],
        reputation_req: 0, // Can be set based on difficulty later
        recipe_name: recipe.name, // Store recipe name for display
        recipe_day: unlockedRecipes.findIndex(r => r.recipe_id === recipe.recipe_id) + 1
      })
    }
  }
  
  // Shuffle orders to mix them up
  return orders.sort(() => Math.random() - 0.5)
}

/**
 * Find matching potion for an order
 * Checks if player has a potion matching the order's recipe requirement
 * 
 * @param {Object} order - Order object
 * @param {Array} potions - Player's potions array
 * @returns {Object|null} Matching potion or null
 */
export function findMatchingPotion(order, potions) {
  return potions.find(potion => 
    potion.recipe_id === order.recipe_id && 
    !potion.sold // Potion not already sold
  )
}

/**
 * Fulfill an order by selling a potion
 * Aligned with Dojo order fulfillment logic
 * 
 * @param {Object} order - Order to fulfill
 * @param {Object} potion - Potion to sell
 * @returns {Object} Result with gold earned and updated potion
 */
export function fulfillOrder(order, potion) {
  if (order.fulfilled) {
    return {
      success: false,
      error: 'Order already fulfilled'
    }
  }
  
  if (potion.recipe_id !== order.recipe_id) {
    return {
      success: false,
      error: 'Potion does not match order requirement'
    }
  }
  
  // Mark potion as sold (will be removed from inventory)
  const updatedPotion = {
    ...potion,
    sold: true
  }
  
  return {
    success: true,
    goldEarned: order.price,
    potion: updatedPotion,
    orderId: order.order_id
  }
}

/**
 * Calculate total earnings from all fulfilled orders
 */
export function calculateTotalEarnings(orders) {
  return orders
    .filter(order => order.fulfilled)
    .reduce((total, order) => total + order.price, 0)
}

