// // Dojo configuration
// // Automatically detects environment and uses appropriate URLs

// // Detect if running locally or on Cartridge hosting
// const isLocalhost = typeof window !== 'undefined' && 
//   (window.location.hostname === 'localhost' || 
//    window.location.hostname === '127.0.0.1' ||
//    window.location.hostname === '' ||
//    window.location.hostname.includes('localhost'));

// // For Cartridge hosting: Update these with your public endpoints
// // You can deploy Katana/Torii using: slot deployments create <name> katana --dev
// const PUBLIC_RPC_URL = "https://api.cartridge.gg/x/demo1/katana"; // TODO: Update with your public Katana endpoint
// const PUBLIC_TORII_URL = "https://api.cartridge.gg/x/demo1/torii"; // TODO: Update with your public Torii endpoint

export const dojoConfig = {
  // World address - update with your deployed world address
  worldAddress:
    "0x03103d4eff4379fd9038e9a801f6a9f7c1a125b472dd88df6151003f6975fa78",

  // RPC URL - use localhost for local dev, public endpoint for hosted
  // rpcUrl: isLocalhost ? "http://localhost:5050/" : PUBLIC_RPC_URL,
  rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  toriiUrl: "http://localhost:5050/",

  // Torii indexer URL
  // toriiUrl: isLocalhost ? "http://localhost:8080/" : PUBLIC_TORII_URL,

  // Namespace (from dojo_dev.toml: namespace.default = "wc")
  namespace: "witchcraft",

  // Relay URL (optional, for real-time messaging)
  relayUrl: undefined,

  // Manifest (can be loaded from file or defined inline)
  manifest: {
    world: {
      address:
        "0x03103d4eff4379fd9038e9a801f6a9f7c1a125b472dd88df6151003f6975fa78", // Will be set from worldAddress
    },
  },
};

// Initialize manifest.world.address from worldAddress
dojoConfig.manifest.world.address = dojoConfig.worldAddress

