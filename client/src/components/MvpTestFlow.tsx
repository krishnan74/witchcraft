import React, { useState, useCallback, ReactElement, ChangeEvent } from 'react';
import { useDojoHook, Direction, IngredientType } from '../hooks/useDojo.ts';

/**
 * MVP Test Flow Component
 * Implements the full MVP flow from test_world.cairo:
 * 1. Spawn player
 * 2. Move player (twice to get to position 5,7)
 * 3. Spawn ingredient node at (5, 7) with BatWing
 * 4. Forage ingredients
 * 5. Start brew (cauldron_id=999, recipe_id=777)
 * 6. Finish brew (cauldron_id=999)
 */

interface Step {
  name: string;
  action: () => Promise<void>;
}

interface CSSProperties {
  [key: string]: string | number | undefined;
}

export default function MvpTestFlow(): ReactElement {
  const {
    spawnPlayer,
    movePlayer,
    spawnNode,
    forage,
    startBrew,
    finishBrew,
    isConnected,
    isSdkReady,
    isPending,
    error,
    accountAddress,
    player,
    position,
    inventory,
    ingredientItems,
    cauldrons,
    potions,
  } = useDojoHook();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState<string>('TestPlayer');
  const [cauldronId, setCauldronId] = useState<string>('999');
  const [recipeId, setRecipeId] = useState<string>('777');

  const addLog = useCallback((message: string): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  }, []);

  const handleSpawnPlayer = useCallback(async (): Promise<void> => {
    try {
      addLog(`Spawning player: ${playerName}...`);
      await spawnPlayer(playerName);
      addLog(`✅ Player "${playerName}" spawned successfully!`);
      setCurrentStep(1);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addLog(`❌ Failed to spawn player: ${error.message}`);
      throw error;
    }
  }, [spawnPlayer, playerName, addLog]);

  const handleMovePlayer = useCallback(async (direction: Direction): Promise<void> => {
    const directionNames: string[] = ['Left', 'Right', 'Up', 'Down'];
    try {
      addLog(`Moving player ${directionNames[direction]}...`);
      await movePlayer(direction);
      addLog(`✅ Player moved ${directionNames[direction]} successfully!`);
      setCurrentStep((prev) => (prev < 6 ? prev + 1 : prev));
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addLog(`❌ Failed to move player: ${error.message}`);
      throw error;
    }
  }, [movePlayer, addLog]);

  const handleSpawnNode = useCallback(async (): Promise<void> => {
    try {
      const x: number = 5;
      const y: number = 7;
      const ingredientType: IngredientType = IngredientType.BatWing;
      const rarity: number = 1;
      const quantity: number = 3;
      
      addLog(`Spawning ingredient node at (${x}, ${y}): BatWing x${quantity}...`);
      await spawnNode(x, y, ingredientType, rarity, quantity);
      addLog(`✅ Ingredient node spawned successfully at (${x}, ${y})!`);
      setCurrentStep(4);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addLog(`❌ Failed to spawn node: ${error.message}`);
      throw error;
    }
  }, [spawnNode, addLog]);

  const handleForage = useCallback(async (): Promise<void> => {
    try {
      addLog('Foraging ingredients...');
      await forage();
      addLog('✅ Ingredients foraged successfully!');
      setCurrentStep(5);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addLog(`❌ Failed to forage: ${error.message}`);
      throw error;
    }
  }, [forage, addLog]);

  const handleStartBrew = useCallback(async (): Promise<void> => {
    try {
      addLog(`Starting brew: Cauldron ${cauldronId}, Recipe ${recipeId}...`);
      await startBrew(cauldronId, recipeId);
      addLog(`✅ Brew started successfully! (Cauldron ${cauldronId}, Recipe ${recipeId})`);
      setCurrentStep(6);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addLog(`❌ Failed to start brew: ${error.message}`);
      throw error;
    }
  }, [startBrew, cauldronId, recipeId, addLog]);

  const handleFinishBrew = useCallback(async (): Promise<void> => {
    try {
      addLog(`Finishing brew: Cauldron ${cauldronId}...`);
      await finishBrew(cauldronId);
      addLog(`✅ Brew finished successfully! Potion created!`);
      setCurrentStep(7);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addLog(`❌ Failed to finish brew: ${error.message}`);
      throw error;
    }
  }, [finishBrew, cauldronId, addLog]);

  // Test flow steps (matching test_world.cairo)
  const steps: Step[] = [
    { name: '1. Spawn Player', action: handleSpawnPlayer },
    { name: '2. Move Player (Up - First)', action: () => handleMovePlayer(Direction.Up) },
    { name: '3. Move Player (Up - Second)', action: () => handleMovePlayer(Direction.Up) },
    { name: '4. Spawn Ingredient Node', action: handleSpawnNode },
    { name: '5. Forage Ingredients', action: handleForage },
    { name: '6. Start Brew', action: handleStartBrew },
    { name: '7. Finish Brew', action: handleFinishBrew },
  ];

  const handleRunFullFlow = useCallback(async (): Promise<void> => {
    if (!isSdkReady || !isConnected) {
      addLog('❌ SDK not ready or wallet not connected');
      return;
    }

    setLogs([]);
    setCurrentStep(0);
    addLog('🚀 Starting MVP Test Flow...');
    addLog('========================================');

    try {
      // Step 1: Spawn player
      await handleSpawnPlayer();
      await new Promise<void>((resolve) => setTimeout(resolve, 1000)); // Wait 1s between steps

      // Step 2: Move player (first)
      await handleMovePlayer(Direction.Up);
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      // Step 3: Move player (second)
      await handleMovePlayer(Direction.Up);
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      // Step 4: Spawn ingredient node
      await handleSpawnNode();
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      // Step 5: Forage
      await handleForage();
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      // Step 6: Start brew
      await handleStartBrew();
      await new Promise<void>((resolve) => setTimeout(resolve, 2000)); // Wait longer for brewing to start

      // Step 7: Finish brew
      await handleFinishBrew();

      addLog('========================================');
      addLog('✅ MVP Test Flow Completed Successfully!');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addLog('========================================');
      addLog(`❌ MVP Test Flow Failed: ${error.message}`);
    }
  }, [
    isSdkReady,
    isConnected,
    addLog,
    handleSpawnPlayer,
    handleMovePlayer,
    handleSpawnNode,
    handleForage,
    handleStartBrew,
    handleFinishBrew,
  ]);

  const handleStepByStep = useCallback(async (): Promise<void> => {
    if (currentStep >= steps.length) {
      addLog('All steps completed!');
      return;
    }

    const step: Step | undefined = steps[currentStep];
    if (step) {
      try {
        await step.action();
      } catch (err: unknown) {
        // Error already logged in handler
        console.error('Step execution error:', err);
      }
    }
  }, [currentStep, steps, addLog]);

  const handleReset = useCallback((): void => {
    setLogs([]);
    setCurrentStep(0);
  }, []);

  const containerStyle: CSSProperties = {
    padding: '20px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '20px auto',
  };

  const mainContainerStyle: CSSProperties = {
    padding: '20px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: '8px',
    maxWidth: '800px',
    margin: '20px auto',
    fontFamily: 'monospace',
  };

  if (!isConnected) {
    return (
      <div style={containerStyle}>
        <h2>MVP Test Flow</h2>
        <p>Please connect your wallet to run the test flow.</p>
      </div>
    );
  }

  if (!isSdkReady) {
    return (
      <div style={containerStyle}>
        <h2>MVP Test Flow</h2>
        <p>Loading Dojo SDK... Please wait for the SDK to initialize.</p>
      </div>
    );
  }

  return (
    <div style={mainContainerStyle}>
      <h2 style={{ marginTop: 0 }}>🧪 MVP Test Flow</h2>
      <p style={{ color: '#aaa', fontSize: '14px' }}>
        Implements the full MVP flow from test_world.cairo
      </p>

      {/* Configuration */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>Configuration</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
          <label>
            Player Name:
            <input
              type="text"
              value={playerName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
              }}
            />
          </label>
          <label>
            Cauldron ID:
            <input
              type="text"
              value={cauldronId}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCauldronId(e.target.value)}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
                width: '60px',
              }}
            />
          </label>
          <label>
            Recipe ID:
            <input
              type="text"
              value={recipeId}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRecipeId(e.target.value)}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
                width: '60px',
              }}
            />
          </label>
        </div>
        <p style={{ fontSize: '12px', color: '#ffa500', margin: 0 }}>
          ⚠️ Note: Cauldron and Recipe must already exist in the world (created via admin/system or pre-deployed).
          In test_world.cairo, these are created via world.write_model_test (test-only). 
          Ensure Cauldron ID {cauldronId} and Recipe ID {recipeId} exist before running Steps 6-7.
        </p>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleRunFullFlow}
          disabled={isPending}
          style={{
            padding: '10px 20px',
            backgroundColor: isPending ? '#444' : '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isPending ? '⏳ Running...' : '🚀 Run Full Flow'}
        </button>
        <button
          onClick={handleStepByStep}
          disabled={isPending || currentStep >= steps.length}
          style={{
            padding: '10px 20px',
            backgroundColor: isPending || currentStep >= steps.length ? '#444' : '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isPending || currentStep >= steps.length ? 'not-allowed' : 'pointer',
          }}
        >
          Next Step ({currentStep + 1}/{steps.length})
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            backgroundColor: '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {/* Step buttons */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Individual Steps:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {steps.map((step: Step, idx: number) => (
            <button
              key={idx}
              onClick={step.action}
              disabled={isPending}
              style={{
                padding: '6px 12px',
                backgroundColor: idx === currentStep ? '#4CAF50' : '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              {step.name}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div style={{
        backgroundColor: '#0a0a0a',
        padding: '15px',
        borderRadius: '4px',
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #444',
      }}>
        <h3 style={{ marginTop: 0, fontSize: '14px', marginBottom: '10px' }}>Logs:</h3>
        {logs.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No logs yet. Click "Run Full Flow" to start.</p>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {logs.map((log: string, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  marginBottom: '4px', 
                  color: log.includes('✅') ? '#4CAF50' : log.includes('❌') ? '#f44336' : '#fff' 
                }}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#3a1a1a',
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#f44336',
        }}>
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Game State Display */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0, fontSize: '14px' }}>Current Game State:</h3>
        <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
          {player && (
            <div>
              <strong>Player:</strong> {player.name} | Gold: {player.gold?.toString()} | Health: {player.health} | Stamina: {player.stamina}
            </div>
          )}
          {position && (
            <div>
              <strong>Position:</strong> ({position.x}, {position.y}) | Zone: {position.zone}
            </div>
          )}
          {inventory && (
            <div>
              <strong>Inventory:</strong> {inventory.count}/{inventory.capacity} items
            </div>
          )}
          {ingredientItems.length > 0 && (
            <div>
              <strong>Ingredients:</strong> {ingredientItems.map((item, idx: number) => (
                <span key={idx}>
                  Type {item.ingredient_type} x{item.quantity}
                  {idx < ingredientItems.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
          {cauldrons.length > 0 && (
            <div>
              <strong>Cauldrons:</strong> {cauldrons.length} found
            </div>
          )}
          {potions.length > 0 && (
            <div>
              <strong>Potions:</strong> {potions.length} created
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

