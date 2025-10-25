import { useEffect, useState } from "react";
import { useEncryptedDiceGame } from "../../hooks/useEncryptedDiceGame";
import { LoadingOverlay } from "../LoadingOverlay";
import { GameSection } from "./GameSection";
import { TokenSwap } from "./TokenSwap";
import { toast } from "sonner";

interface GameInterfaceProps {
  onShowOverlay?: (message: string, description?: string, showDice?: boolean) => void;
  onHideOverlay?: () => void;
}

export function GameInterface({ onShowOverlay, onHideOverlay }: GameInterfaceProps) {
  const [diceMode, setDiceMode] = useState<1 | 2 | 3>(1);
  const [stakeAmount, setStakeAmount] = useState("10");
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<number[]>([1]);
  const [lastResult, setLastResult] = useState<{ win: boolean; payout: number } | null>(null);
  const [prediction, setPrediction] = useState<"even" | "odd">("even");

  // Swap state - moved to TokenSwap component

  // Smart contract integration - now using real hook
  const {
    // State
    isLoading: isContractLoading,
    error: contractError,
    gameHistory,
    encryptedBalance,
    gameCounter,
    contractAddress,
    isContractAvailable,

    // Actions
    startGame,
    resolveGame,
    swapETHForROLL,
    mintTokens,
    decryptBalance,
    getGameDetails,
    refresh,
    clearError,
  } = useEncryptedDiceGame();

  // Get decrypted balance (provide a default value)
  const balance = decryptBalance() || 0;
  const isContractReady = isContractAvailable;
  const games = gameHistory || []; // Clear contract errors when component mounts
  useEffect(() => {
    if (contractError) {
      clearError();
    }
  }, [contractError, clearError]);

  // Show contract errors as toasts
  useEffect(() => {
    if (contractError) {
      toast.error("Contract Error", {
        description: contractError,
      });
    }
  }, [contractError]);

  const handleRoll = async () => {
    const stake = parseFloat(stakeAmount);
    if (isNaN(stake) || stake <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    // Check if smart contract is available
    if (!isContractReady) {
      toast.error("Smart contract not ready. Please check your network connection.");
      return;
    }

    // Check balance
    if (balance < stake) {
      toast.error("Insufficient ROLL balance", {
        description: `You need ${stake} ROLL but only have ${balance} ROLL`,
      });
      return;
    }

    setIsRolling(true);
    setLastResult(null);

    try {
      onShowOverlay?.("Starting Game...", "Encrypting your prediction and stake", false);

      // Start the game on smart contract
      const gameId = await startGame(diceMode, prediction, stake);

      if (gameId !== null) {
        onShowOverlay?.("Game Started!", `Game ID: ${gameId}. Rolling dice...`, true);

        // Wait a moment for visual effect
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Auto-resolve the game
        await resolveGame(Number(gameId));

        // Refresh data to get latest results
        await refresh();

        // Find the resolved game
        const resolvedGame = games.find((g: any) => g.id === gameId);
        if (resolvedGame) {
          setDiceValues(resolvedGame.result || []);
          setLastResult({
            win: resolvedGame.won || false,
            payout: resolvedGame.won ? stake * 1.95 : 0,
          });

          toast.success(resolvedGame.won ? "You won!" : "You lost!", {
            description: `Dice: ${resolvedGame.result?.join(", ")} | ${resolvedGame.won ? `Won ${stake * 1.95} ROLL` : `Lost ${stake} ROLL`}`,
          });
        }

        onHideOverlay?.();
      }
    } catch (error: any) {
      console.error("Error in game:", error);
      toast.error("Game Failed", {
        description: error?.message || "Unknown error occurred",
      });
      onHideOverlay?.();
    } finally {
      setIsRolling(false);
    }
  };

  // Handle minting tokens for testing
  const handleMintTokens = async () => {
    if (!isContractReady) {
      toast.error("Smart contract not ready");
      return;
    }

    try {
      await mintTokens(1000); // Mint 1000 ROLL for testing
      toast.success("Minted 1000 ROLL tokens for testing!");
      await refresh();
    } catch (error: any) {
      console.error("Mint error:", error);
      toast.error("Failed to mint tokens", {
        description: error?.message || "Please try again",
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Game Section - 70% */}
      <GameSection
        diceMode={diceMode}
        setDiceMode={setDiceMode}
        diceValues={diceValues}
        setDiceValues={setDiceValues}
        stakeAmount={stakeAmount}
        setStakeAmount={setStakeAmount}
        prediction={prediction}
        setPrediction={setPrediction}
        isRolling={isRolling}
        lastResult={lastResult}
        balance={balance}
        onRoll={handleRoll}
      />

      {/* Swap Section - 30% */}
      <TokenSwap
        balance={balance}
        isContractReady={isContractReady}
        isContractLoading={isContractLoading}
        contractError={contractError}
        onMintTokens={handleMintTokens}
        onSwapETHForROLL={swapETHForROLL}
        onRefresh={refresh}
        onClearError={clearError}
      />

      {isRolling && <LoadingOverlay message="Rolling Dice..." description="Generating encrypted dice results" />}
      {isContractLoading && <LoadingOverlay message="Processing..." description="Interacting with smart contract" />}
    </div>
  );
}
