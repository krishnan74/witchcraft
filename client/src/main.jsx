// main.jsx
 
// React imports
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
 
// Dojo imports
import { init } from "@dojoengine/sdk";
import { DojoSdkProvider } from "@dojoengine/sdk/react";
import { createDojoConfig } from "@dojoengine/core";
 
// Cartridge Controller imports
import Controller from "@cartridge/controller";
 
// Local imports
import { dojoConfig } from "./dojoConfig.ts";
import { setupWorld } from "./dojoSetup.ts";
 
async function main() {
    // Load manifest dynamically to avoid Vite's static JSON parsing issues with large files
    let manifest;
    
    // Try loading from public directory first (most reliable for large files)
    try {
        const response = await fetch("/manifest_dev.json");
        if (response.ok) {
            manifest = await response.json();
        } else {
            throw new Error("Manifest not found in public directory");
        }
    } catch (publicError) {
        console.warn("Could not load manifest from public directory, trying source file:", publicError);
        
        // Fallback: try loading from source with ?url suffix
        try {
            const manifestModule = await import("../../contracts/manifest_dev.json?url");
            const manifestUrl = manifestModule.default;
            const response = await fetch(manifestUrl);
            manifest = await response.json();
        } catch (urlError) {
            console.error("Failed to load manifest with ?url:", urlError);
            // Last resort: try ?raw
            try {
                const manifestModule = await import("../../contracts/manifest_dev.json?raw");
                manifest = JSON.parse(manifestModule.default);
            } catch (rawError) {
                console.error("Failed to load manifest with ?raw:", rawError);
                throw new Error("Could not load manifest file. Please ensure manifest_dev.json exists in client/public/ or contracts/ directory.");
            }
        }
    }
    
    // Ensure worldAddress is a valid string
    const worldAddress = (dojoConfig.worldAddress && dojoConfig.worldAddress !== "0x0000000000000000000000000000000000000000000000000000000000000000") 
        ? dojoConfig.worldAddress 
        : manifest.world?.address || "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    // Ensure all URLs are strings (not undefined)
    const rpcUrl = dojoConfig.rpcUrl || "http://localhost:5050";
    const toriiUrl = dojoConfig.toriiUrl || "http://localhost:8080";
    
    // Create Dojo config from manifest using createDojoConfig helper
    // This ensures the manifest is properly formatted for the SDK
    const config = createDojoConfig({
        rpcUrl: rpcUrl,
        toriiUrl: toriiUrl,
        worldAddress: worldAddress,
        manifest: manifest,
    });
    
    // Debug: log config to see what createDojoConfig returns
    console.log("Dojo config created:", {
        worldAddress: worldAddress,
        rpcUrl: rpcUrl,
        toriiUrl: toriiUrl,
        configKeys: Object.keys(config),
        hasManifest: !!config.manifest,
        manifestKeys: config.manifest ? Object.keys(config.manifest) : []
    });
    
    // Use the original computed values instead of config values
    // createDojoConfig may structure things differently
    const finalWorldAddress = worldAddress;
    const finalRpcUrl = rpcUrl;
    const finalToriiUrl = toriiUrl;
    
    // Validate all required values
    if (!finalWorldAddress || typeof finalWorldAddress !== 'string') {
        throw new Error(`Invalid worldAddress: ${finalWorldAddress}. Must be a valid string.`);
    }
    if (!finalRpcUrl || typeof finalRpcUrl !== 'string') {
        throw new Error(`Invalid rpcUrl: ${finalRpcUrl}. Must be a valid string.`);
    }
    if (!finalToriiUrl || typeof finalToriiUrl !== 'string') {
        throw new Error(`Invalid toriiUrl: ${finalToriiUrl}. Must be a valid string.`);
    }
    if (!config.manifest) {
        throw new Error(`Invalid manifest: manifest is missing from config.`);
    }
    
    // Initialize the SDK with configuration options
    // Use the original computed values and config.manifest from createDojoConfig
    const sdkInitConfig = {
        client: {
            worldAddress: finalWorldAddress,
            toriiUrl: finalToriiUrl,
            rpcUrl: finalRpcUrl,
        },
        domain: {
            name: "Witchcraft",
            version: "1.0",
            chainId: "SN_SEPOLIA",
            revision: "1",
        },
        manifest: config.manifest,
    };
    
    // Add relayUrl only if it exists and is a string
    if (config.relayUrl && typeof config.relayUrl === 'string') {
        sdkInitConfig.client.relayUrl = config.relayUrl;
    }
    
    console.log("Initializing SDK with config:", {
        worldAddress: sdkInitConfig.client.worldAddress,
        rpcUrl: sdkInitConfig.client.rpcUrl,
        toriiUrl: sdkInitConfig.client.toriiUrl,
        hasManifest: !!sdkInitConfig.manifest
    });
    
    // Build Controller policies from manifest (we already have manifest loaded)
    const policies = {
        contracts: {},
    };
    
    if (manifest && manifest.contracts) {
        // Configure policies for each system contract
        const systemContracts = [
            { tag: 'wc-spawn_system', name: 'Spawn System', description: 'Player spawning system', entrypoints: ['spawn_player'] },
            { tag: 'wc-movement_system', name: 'Movement System', description: 'Player movement system', entrypoints: ['move_player'] },
            { tag: 'wc-forage_system', name: 'Forage System', description: 'Ingredient foraging system', entrypoints: ['forage'] },
            { tag: 'wc-brewing_system', name: 'Brewing System', description: 'Potion brewing system', entrypoints: ['start_brew', 'finish_brew'] },
        ];
        
        systemContracts.forEach(({ tag, name, description, entrypoints }) => {
            const contract = manifest.contracts.find((c) => c.tag === tag);
            if (contract) {
                policies.contracts[contract.address] = {
                    name: name,
                    description: description,
                    methods: entrypoints.map((entrypoint) => ({
                        name: entrypoint.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                        entrypoint: entrypoint,
                        description: `${description} - ${entrypoint}`,
                    })),
                };
            }
        });
        
        console.log('Controller policies configured for contracts:', Object.keys(policies.contracts));
    }
    
    // Initialize Cartridge Controller for wallet connection with policies
    const controller = new Controller({
        // Configure chains
        chains: [
            { rpcUrl: finalRpcUrl },
        ],
        // Add policies for secure transaction approvals
        ...(Object.keys(policies.contracts).length > 0 && { policies }),
    });
    
    // Initialize the SDK (account will be connected via Controller later)
    const sdk = await init({
        ...sdkInitConfig,
    });
    
    // Store controller globally for wallet connection component
    window.cartridgeController = controller;
 
    createRoot(document.getElementById("root")).render(
        <DojoSdkProvider 
            sdk={sdk} 
            dojoConfig={config} 
            clientFn={setupWorld}
        >
            <App controller={controller} />
        </DojoSdkProvider>
    );
}
 
main();