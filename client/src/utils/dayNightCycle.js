/**
 * Day/Night Cycle System
 * Aligned with Dojo WorldState model
 * 
 * Day: 2 minutes (120 seconds)
 * Night: 1 minute (60 seconds)
 * Shop opens only during night time
 */

export const CYCLE_TIMES = {
  DAY_DURATION: 120000,   // 2 minutes in milliseconds
  NIGHT_DURATION: 60000   // 1 minute in milliseconds
}

/**
 * Initialize day/night cycle
 */
export function initializeCycle() {
  return {
    cycleStartTime: Date.now(),
    currentPhase: 'Day', // 'Day' or 'Night'
    elapsedTime: 0
  }
}

/**
 * Update day/night cycle
 * Returns the current phase and time remaining
 */
export function updateCycle(cycleState) {
  const now = Date.now()
  const elapsed = now - cycleState.cycleStartTime
  const cycleDuration = cycleState.currentPhase === 'Day' 
    ? CYCLE_TIMES.DAY_DURATION 
    : CYCLE_TIMES.NIGHT_DURATION
  
  if (elapsed >= cycleDuration) {
    // Phase complete - switch to next phase
    const nextPhase = cycleState.currentPhase === 'Day' ? 'Night' : 'Day'
    const newCycleStartTime = now - (elapsed - cycleDuration) // Account for overflow
    
    return {
      ...cycleState,
      currentPhase: nextPhase,
      cycleStartTime: newCycleStartTime,
      elapsedTime: elapsed - cycleDuration,
      phaseChanged: true,
      shouldAdvanceDay: nextPhase === 'Day' // Advance day when night ends
    }
  }
  
  return {
    ...cycleState,
    elapsedTime: elapsed,
    phaseChanged: false,
    shouldAdvanceDay: false
  }
}

/**
 * Get time remaining in current phase (in milliseconds)
 */
export function getTimeRemaining(cycleState) {
  const now = Date.now()
  const elapsed = now - cycleState.cycleStartTime
  const cycleDuration = cycleState.currentPhase === 'Day' 
    ? CYCLE_TIMES.DAY_DURATION 
    : CYCLE_TIMES.NIGHT_DURATION
  
  return Math.max(0, cycleDuration - elapsed)
}

/**
 * Format time remaining as MM:SS
 */
export function formatTimeRemaining(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

