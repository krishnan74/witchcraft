
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
  

  const updatedItems = consumeIngredients(recipe, ingredientItems)
  
 
  const brewStartTime = Date.now()
  const brewEndTime = brewStartTime + (recipe.base_time * 1000) 
  
  return {
    success: true,
    cauldronId,
    recipeId: recipe.recipe_id,
    brewStartTime,
    brewEndTime,
    updatedItems
  }
}


 
export function finishBrew(recipe, cauldronQuality = 1) {

  const potion = createPotion(recipe, cauldronQuality, recipe.difficulty)
  

  const goldEarned = potion.quality >= 80 ? recipe.base_value : 0
  
  return {
    success: true,
    potion,
    goldEarned
  }
}

