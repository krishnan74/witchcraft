import { useMemo, useState, useCallback, useEffect, useContext } from "react";
import { DojoContext } from "@dojoengine/sdk/react";
import { AccountInterface } from "starknet";
import { dojoConfig } from "../dojoConfig";
import Controller from "@cartridge/controller";

// Extend Window interface for TypeScript
declare global {
  interface Window {
    cartridgeController?: Controller;
  }
}

// Type definitions matching Cairo models
export interface Player {
  addr: string;
  name: string;
  gold: bigint;
  health: number;
  stamina: number;
  reputation: number;
}

export interface Position {
  owner: string;
  x: number;
  y: number;
  zone: string;
}

export interface Inventory {
  owner: string;
  capacity: number;
  count: number;
}

export interface IngredientItem {
  owner: string;
  slot: number;
  ingredient_type: number;
  quantity: number;
}

export interface Cauldron {
  owner: string;
  cauldron_id: string;
  quality: number;
  brewing_until: bigint;
  recipe_id: string;
  busy: boolean;
}

export interface Recipe {
  recipe_id: string;
  name: string;
  effect: number;
  difficulty: number;
  base_time: bigint;
  base_value: bigint;
}

export interface Potion {
  potion_id: string;
  owner: string;
  recipe_id: string;
  effect: number;
  quality: number;
  value: bigint;
}

export interface FactionReputation {
  player: string;
  faction: number;
  reputation: number;
}

// Direction enum values (matching Cairo Direction enum)
export enum Direction {
  Left = 0,
  Right = 1,
  Up = 2,
  Down = 3,
}

// IngredientType enum values (matching Cairo IngredientType enum)
export enum IngredientType {
  MandrakeRoot = 0,
  GraveDust = 1,
  BatWing = 2,
  GhostMushroom = 3,
  WyrmScale = 4,
  VampireBloom = 5,
  PumpkinSeed = 6,
}

export interface UseDojoReturn {
  // Connection state
  account: AccountInterface | null;
  isConnected: boolean;
  accountAddress: string | null;

  // System functions
  spawnPlayer: (name: string) => Promise<void>;
  movePlayer: (direction: Direction) => Promise<void>;
  spawnNode: (x: number, y: number, ingredientType: IngredientType, rarity: number, quantity: number) => Promise<void>;
  forage: () => Promise<void>;
  startBrew: (cauldronId: string, recipeId: string) => Promise<void>;
  finishBrew: (cauldronId: string) => Promise<void>;

  // Transaction state
  isPending: boolean;
  error: Error | null;
  isSdkReady: boolean;

  // Data queries (will be populated via Torii subscriptions)
  player: Player | null;
  position: Position | null;
  inventory: Inventory | null;
  ingredientItems: IngredientItem[];
  cauldrons: Cauldron[];
  potions: Potion[];
  factionReputations: FactionReputation[];

  // Helper functions
  refreshData: () => Promise<void>;
}

// Helper function to convert string to felt252
function stringToFelt(str: string): bigint {
  // SNIP-12 encoding for short strings
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  if (bytes.length > 31) {
    throw new Error("String too long for felt252");
  }
  let felt = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    felt = felt * BigInt(256) + BigInt(bytes[i]);
  }
  return felt;
}

export function useDojoHook(): UseDojoReturn {
  const dojoContext = useContext(DojoContext);

  if (!dojoContext) {
    throw new Error("useDojoHook must be used within DojoSdkProvider");
  }

  const { sdk, account: dojoAccount } = dojoContext;

  // Get account from Controller if available, otherwise use Dojo context account
  const controller =
    typeof window !== "undefined" && window.cartridgeController
      ? window.cartridgeController
      : null;

  // State to track controller account changes
  const [controllerAccount, setControllerAccount] = useState(
    controller?.account || null
  );

  // Update controller account when it changes
  useEffect(() => {
    if (!controller) return;

    // Check for existing account
    const checkAccount = () => {
      const currentAccount = controller.account || null;
      setControllerAccount((prevAccount) => {
        if (currentAccount !== prevAccount) {
          // Update SDK account when controller account changes
          if (sdk && currentAccount) {
            sdk.account = currentAccount;
            console.log(
              "Updated SDK account from Controller:",
              currentAccount.address
            );
          }
          return currentAccount;
        }
        return prevAccount;
      });
    };

    // Initial check
    checkAccount();

    // Poll for account changes (Controller doesn't emit events, so we poll)
    const interval = setInterval(checkAccount, 500); // Check every 500ms

    // Also listen for custom event from WalletConnect
    const handleAccountChange = () => {
      checkAccount();
    };
    window.addEventListener("controller-account-changed", handleAccountChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "controller-account-changed",
        handleAccountChange
      );
    };
  }, [controller, sdk]);

  const account = controllerAccount || dojoAccount;

  // Load manifest to get contract addresses (matching dojo-intro pattern)
  const [manifest, setManifest] = useState<any>(null);

  useEffect(() => {
    const loadManifest = async () => {
      try {
        const response = await fetch("/manifest_dev.json");
        if (response.ok) {
          const manifestData = await response.json();
          setManifest(manifestData);
        }
      } catch (err) {
        console.error("Failed to load manifest:", err);
      }
    };
    loadManifest();
  }, []);

  // Create execute function using account.execute() pattern (from dojo-intro example)
  // The account from Controller has an execute method that we use directly
  const executeSystem = useCallback(
    async (
      systemTag: string,
      entrypoint: string,
      calldata: any[],
      accountToUse: any
    ) => {
      if (!accountToUse) {
        throw new Error("Account not provided");
      }

      if (!accountToUse.execute) {
        throw new Error(
          "Account does not have execute method. Make sure Controller account is connected."
        );
      }

      if (!manifest) {
        throw new Error("Manifest not loaded. Please wait...");
      }

      // Find contract address from manifest using tag (matching dojo-intro pattern)
      const contract = manifest.contracts?.find(
        (c: any) => c.tag === systemTag
      );
      if (!contract) {
        throw new Error(
          `Contract not found for tag: ${systemTag}. Available tags: ${
            manifest.contracts?.map((c: any) => c.tag).join(", ") || "none"
          }`
        );
      }

      // Validate contract has an address
      if (!contract.address) {
        throw new Error(`Contract ${systemTag} has no address in manifest`);
      }

      console.log(
        `Found contract ${systemTag} at address: ${contract.address}`
      );

      // Convert calldata to strings (Cairo/starknet expects string representation)
      const calldataStrings = calldata.map((param: any) => {
        if (typeof param === "bigint") {
          return param.toString();
        }
        return String(param);
      });

      console.log("Executing system:", {
        systemTag,
        entrypoint,
        contractAddress: contract.address,
        calldata: calldataStrings,
      });

      // Use account.execute() directly (matching dojo-intro pattern)
      try {
        const tx = await accountToUse.execute({
          contractAddress: contract.address,
          entrypoint: entrypoint,
          calldata: calldataStrings,
        });

        console.log("Transaction sent:", tx);

        // Match dojo-intro pattern: don't wait for receipt, just return
        // Controller will handle transaction execution and show errors in UI
        return tx;
      } catch (executeError: any) {
        console.error("Execute error details:", executeError);

        // Extract meaningful error message
        let errorMessage = "Transaction execution failed";

        // Check for "not deployed" error specifically
        const errorStr = JSON.stringify(executeError);
        if (errorStr.includes("not deployed")) {
          const match = errorStr.match(
            /Requested contract address (0x[a-fA-F0-9]+) is not deployed/
          );
          if (match) {
            const contractAddr = match[1];
            errorMessage =
              `Contract at address ${contractAddr} is not deployed on this network.\n\n` +
              `This usually means:\n` +
              `1. You're using the wrong network (check if you're on Katana localhost vs Sepolia)\n` +
              `2. The contracts haven't been deployed yet\n` +
              `3. The manifest has addresses from a different deployment\n\n` +
              `Current contract address: ${contract.address}\n` +
              `System: ${systemTag}::${entrypoint}\n\n` +
              `If using local development, make sure:\n` +
              `- Katana is running on http://localhost:5050\n` +
              `- Contracts are deployed (run: sozo migrate --profile dev)\n` +
              `- You're using manifest_dev.json (not a Sepolia manifest)`;
          }
        }

        if (executeError.message) {
          errorMessage = executeError.message;
        } else if (executeError.revert_reason) {
          errorMessage = `Transaction reverted: ${executeError.revert_reason}`;
        } else if (executeError.data?.execution_error) {
          // Extract nested error details
          const execError = executeError.data.execution_error;
          if (execError.includes("not deployed")) {
            errorMessage = execError;
          } else {
            errorMessage = `Execution error: ${execError}`;
          }
        } else if (typeof executeError === "string") {
          errorMessage = executeError;
        } else if (executeError.error) {
          errorMessage = executeError.error;
        }

        throw new Error(errorMessage);
      }
    },
    [manifest]
  );

  // Debug: log SDK readiness
  useEffect(() => {
    console.log("SDK Readiness Check:", {
      hasSdk: !!sdk,
      hasAccount: !!account,
      hasAccountExecute: !!account?.execute,
      accountAddress: account?.address,
      controllerAccount: controllerAccount?.address,
      dojoAccount: dojoAccount?.address,
      hasManifest: !!manifest,
      isSdkReady: !!sdk && !!account && !!account?.execute && !!manifest,
    });
  }, [sdk, account, controllerAccount, dojoAccount, manifest]);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Data state (will be updated via Torii subscriptions)
  const [player, setPlayer] = useState<Player | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [ingredientItems, setIngredientItems] = useState<IngredientItem[]>([]);
  const [cauldrons, setCauldrons] = useState<Cauldron[]>([]);
  const [potions, setPotions] = useState<Potion[]>([]);
  const [factionReputations, setFactionReputations] = useState<
    FactionReputation[]
  >([]);

  const accountAddress = account?.address || null;
  const isConnected = !!account && !!accountAddress;

  // System call functions using execute method
  // System names: wc-spawn_system, wc-movement_system, wc-forage_system, wc-brewing_system
  const spawnPlayer = useCallback(
    async (name: string): Promise<void> => {
      if (!account || !accountAddress) {
        throw new Error("Account not connected");
      }
      if (!sdk) {
        throw new Error(
          "SDK not initialized. Please wait for the SDK to load."
        );
      }

      setIsPending(true);
      setError(null);

      try {
        const nameFelt = stringToFelt(name);

        // Execute spawn_player system using account.execute() pattern
        // System tag from manifest: wc-spawn_system
        await executeSystem(
          "wc-spawn_system",
          "spawn_player",
          [nameFelt],
          account
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [account, accountAddress, sdk, executeSystem]
  );

  const movePlayer = useCallback(
    async (direction: Direction): Promise<void> => {
      if (!account || !accountAddress) {
        throw new Error("Account not connected");
      }
      if (!sdk) {
        throw new Error(
          "SDK not initialized. Please wait for the SDK to load."
        );
      }

      setIsPending(true);
      setError(null);

      try {
        // Execute move_player system with direction enum value
        await executeSystem(
          "wc-movement_system",
          "move_player",
          [direction],
          account
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [account, accountAddress, sdk, executeSystem]
  );

  const spawnNode = useCallback(
    async (
      x: number,
      y: number,
      ingredientType: IngredientType,
      rarity: number,
      quantity: number
    ): Promise<void> => {
      if (!account || !accountAddress) {
        throw new Error("Account not connected");
      }
      if (!sdk) {
        throw new Error(
          "SDK not initialized. Please wait for the SDK to load."
        );
      }

      setIsPending(true);
      setError(null);

      try {
        // Execute spawn_node system
        await executeSystem(
          "wc-node_spawn_system",
          "spawn_node",
          [x, y, ingredientType, rarity, quantity],
          account
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [account, accountAddress, sdk, executeSystem]
  );

  const forageAction = useCallback(async (): Promise<void> => {
    if (!account || !accountAddress) {
      throw new Error("Account not connected");
    }
    if (!sdk) {
      throw new Error("SDK not initialized. Please wait for the SDK to load.");
    }

    setIsPending(true);
    setError(null);

    try {
      // Execute forage system (no parameters)
      await executeSystem("wc-forage_system", "forage", [], account);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [account, accountAddress, sdk, executeSystem]);

  const startBrew = useCallback(
    async (cauldronId: string, recipeId: string): Promise<void> => {
      if (!account || !accountAddress) {
        throw new Error("Account not connected");
      }
      if (!sdk) {
        throw new Error(
          "SDK not initialized. Please wait for the SDK to load."
        );
      }

      setIsPending(true);
      setError(null);

      try {
        const cauldronIdFelt = BigInt(cauldronId);
        const recipeIdFelt = BigInt(recipeId);

        // Execute start_brew system
        await executeSystem(
          "wc-brewing_system",
          "start_brew",
          [cauldronIdFelt, recipeIdFelt],
          account
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [account, accountAddress, sdk, executeSystem]
  );

  const finishBrew = useCallback(
    async (cauldronId: string): Promise<void> => {
      if (!account || !accountAddress) {
        throw new Error("Account not connected");
      }
      if (!sdk) {
        throw new Error(
          "SDK not initialized. Please wait for the SDK to load."
        );
      }

      setIsPending(true);
      setError(null);

      try {
        const cauldronIdFelt = BigInt(cauldronId);

        // Execute finish_brew system
        await executeSystem(
          "wc-brewing_system",
          "finish_brew",
          [cauldronIdFelt],
          account
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [account, accountAddress, sdk, executeSystem]
  );

  // Fetch data from Torii using SDK's query capabilities
  useEffect(() => {
    if (!sdk || !accountAddress) return;

    const fetchData = async () => {
      try {
        // The SDK should provide query methods via Torii
        // This is a placeholder - actual implementation depends on SDK API
        // You may need to use sdk.torii or similar to query entities
        // Example query structure (adjust based on actual SDK API):
        // const playerData = await sdk.query('Player', accountAddress)
        // setPlayer(playerData)
      } catch (err) {
        console.error("Error fetching data from Torii:", err);
      }
    };

    fetchData();

    // Set up subscriptions for real-time updates
    // The SDK should handle this automatically, but you may need to configure it
  }, [sdk, accountAddress]);

  const refreshData = useCallback(async () => {
    // Force refresh by re-fetching from Torii
    // The SDK should handle this automatically via subscriptions
    // This is a placeholder for manual refresh if needed
    if (!sdk || !accountAddress) return;

    try {
      // Trigger a re-fetch of all data
      // Implementation depends on SDK's actual query API
      console.log("Refreshing data from Torii...");
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  }, [sdk, accountAddress]);

  return {
    account: account || null,
    isConnected,
    accountAddress,
    spawnPlayer,
    movePlayer,
    spawnNode,
    forage: forageAction,
    startBrew,
    finishBrew,
    isPending,
    error,
    // SDK is ready if we have SDK, account with execute method, and manifest
    isSdkReady: !!sdk && !!account && !!account?.execute && !!manifest,
    player,
    position,
    inventory,
    ingredientItems,
    cauldrons,
    potions,
    factionReputations,
    refreshData,
  };
}
