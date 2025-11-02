// Setup function for Dojo World
// This creates the world client configuration with system calls

import { dojoConfig } from './dojoConfig'

export function setupWorld() {
  // Return world configuration with system call mappings
  // The SDK will use the manifest to automatically generate system calls
  // Note: Manifest is loaded in main.jsx and passed to SDK init
  return {
    worldAddress: dojoConfig.worldAddress,
    // System call configuration
    // The SDK automatically generates system calls from the manifest
    // Systems are accessed via: wc-spawn_system, wc-movement_system, etc.
  }
}

