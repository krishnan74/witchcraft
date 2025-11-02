/**
 * Brewing System - Client-side implementation
 * Structured to align with Dojo brewing_system.cairo for easy integration
 * 
 * In Dojo integration, these functions will call the contract methods:
 * - start_brew(cauldron_id, recipe_id) 
 * - finish_brew(cauldron_id)
 */

/**
 * Check if player has required ingredients for a recipe
 * Aligns with start_brew ingredient checking logic
 */
export function checkIngredientRequirements(recipe, ingredientItems) {
  const missing = []
  
  for (const req of recipe.ingredients) {
    const owned = ingredientItems.find(item => item.ingredient_type === req.ingredient_type)
    const ownedQty = owned ? owned.quantity : 0
    
    if (ownedQty < req.quantity) {
      missing.push({
        ingredient_type: req.ingredient_type,
        required: req.quantity,
        owned: ownedQty,
        missing: req.quantity - ownedQty
      })
    }
  }
  
  return {
    hasAll: missing.length === 0,
    missing: missing
  }
}

/**
 * Consume ingredients from inventory (simulates Dojo consume_ingredient)
 * Aligns with brewing_system.cairo consume_ingredient logic
 */
export function consumeIngredients(recipe, ingredientItems) {
  const updatedItems = [...ingredientItems]
  
  for (const req of recipe.ingredients) {
    let remaining = req.quantity
    
    for (let i = 0; i < updatedItems.length && remaining > 0; i++) {
      const item = updatedItems[i]
      
      if (item.ingredient_type === req.ingredient_type && item.quantity > 0) {
        if (item.quantity >= remaining) {
          // Consume all remaining
          item.quantity -= remaining
          remaining = 0
        } else {
          // Consume this entire slot
          remaining -= item.quantity
          item.quantity = 0
        }
        
        // Remove item if quantity is 0
        if (item.quantity === 0) {
          updatedItems.splice(i, 1)
          i-- // Adjust index after removal
        }
      }
    }
  }
  
  // Update slot indices after removal
  updatedItems.forEach((item, index) => {
    item.slot = index
  })
  
  return updatedItems
}

/**
 * Create a potion (simulates Dojo potion creation)
 * Aligns with brewing_system.cairo finish_brew potion creation
 */
export function createPotion(recipe, cauldronQuality = 1, difficulty = 1) {
  const BASE_SUCCESS_MULTIPLIER = 10
  const successChance = (cauldronQuality * BASE_SUCCESS_MULTIPLIER) / difficulty
  const potionQuality = successChance >= 5 ? 80 : 20
  
  // Generate unique potion ID (in Dojo this would be from contract)
  const potionId = `potion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    potion_id: potionId,
    owner: 'player', // Will be ContractAddress in Dojo
    recipe_id: recipe.recipe_id,
    effect: recipe.effect,
    quality: potionQuality,
    value: recipe.base_value
  }
}

/**
 * Start brewing process
 * Client-side simulation - will call Dojo start_brew(cauldron_id, recipe_id) when integrated
 */
export function startBrew(recipe, ingredientItems, cauldronId = 'cauldron_1') {
  // Check ingredients (matches Dojo start_brew checks)
  const check = checkIngredientRequirements(recipe, ingredientItems)
  
  if (!check.hasAll) {
    return {
      success: false,
      error: 'Not enough ingredients to start brewing!',
      missing: check.missing
    }
  }
  
  // Consume ingredients (matches Dojo consume_ingredient logic)
  const updatedItems = consumeIngredients(recipe, ingredientItems)
  
  // Calculate brewing time (in Dojo this uses block numbers)
  const brewStartTime = Date.now()
  const brewEndTime = brewStartTime + (recipe.base_time * 1000) // Convert seconds to ms
  
  return {
    success: true,
    cauldronId,
    recipeId: recipe.recipe_id,
    brewStartTime,
    brewEndTime,
    updatedItems
  }
}

/**
 * Finish brewing and create potion
 * Client-side simulation - will call Dojo finish_brew(cauldron_id) when integrated
 */
export function finishBrew(recipe, cauldronQuality = 1) {
  // Create potion (matches Dojo finish_brew logic)
  const potion = createPotion(recipe, cauldronQuality, recipe.difficulty)
  
  // Calculate gold reward (in Dojo this is handled by contract)
  const goldEarned = potion.quality >= 80 ? recipe.base_value : 0
  
  return {
    success: true,
    potion,
    goldEarned
  }
}

