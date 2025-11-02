// Dojo configuration for Sepolia deployment
// Update these values with your actual deployed world address

export const dojoConfig = {
  // World address - update with your deployed Sepolia world address
  worldAddress: "0x03103d4eff4379fd9038e9a801f6a9f7c1a125b472dd88df6151003f6975fa78", // TODO: Update with actual Sepolia world address
  
  // RPC URL for Sepolia
  rpcUrl: "http://localhost:5050/",
  
  // Torii indexer URL
  toriiUrl: "http://localhost:8080/",
  
  // Namespace (from dojo_dev.toml: namespace.default = "wc")
  namespace: "witchcraft",
  
  // Relay URL (optional, for real-time messaging)
  relayUrl: undefined,
  
  // Manifest (can be loaded from file or defined inline)
  manifest: {
    world: {
      address: "0x03103d4eff4379fd9038e9a801f6a9f7c1a125b472dd88df6151003f6975fa78" // Will be set from worldAddress
    }
  }
}

// Initialize manifest.world.address from worldAddress
dojoConfig.manifest.world.address = dojoConfig.worldAddress

