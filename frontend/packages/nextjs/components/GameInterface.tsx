import { useEffect, useState } from "react";
import { Dice3D } from "./Dice3D";
import { LoadingOverlay } from "./LoadingOverlay";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { ArrowDownUp, Coins, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useEncryptedDiceGame } from "~~/hooks/useEncryptedDiceGame";

interface GameInterfaceProps {
  rollBalance: number;
  ethBalance: number;
  onRoll: (stake: number, result: { diceValues: number[]; win: boolean; payout: number }) => void;
  onSwap: (fromToken: "ETH" | "ROLL", amount: number) => void;
  onShowOverlay?: (message: string, description?: string, showDice?: boolean) => void;
  onHideOverlay?: () => void;
}

export function GameInterface({
  rollBalance,
  ethBalance,
  onRoll,
  onSwap,
  onShowOverlay,
  onHideOverlay,
}: GameInterfaceProps) {
  const [diceMode, setDiceMode] = useState<1 | 2 | 3>(1);
  const [stakeAmount, setStakeAmount] = useState("10");
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<number[]>([1]);
  const [lastResult, setLastResult] = useState<{ win: boolean; payout: number } | null>(null);
  const [prediction, setPrediction] = useState<"even" | "odd">("even");

  // Swap state
  const [fromToken, setFromToken] = useState<"ETH" | "ROLL">("ETH");
  const [swapAmount, setSwapAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  // Smart contract integration
  const {
    isLoading: isContractLoading,
    error: contractError,
    startGame,
    resolveGame,
    swapETHForROLL,
    mintTokens,
    gameHistory,
    isContractAvailable,
    clearError,
  } = useEncryptedDiceGame();

  // Clear contract errors when component mounts
  useEffect(() => {
    if (contractError) {
      clearError();
    }
  }, [contractError, clearError]);

  const handleRoll = async () => {
    const stake = parseFloat(stakeAmount);
    if (isNaN(stake) || stake <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    // Check if smart contract is available
    if (!isContractAvailable) {
      toast.error("Smart contract not available. Using demo mode.");
      // Fallback to original hardcoded logic
      await handleRollFallback(stake);
      return;
    }

    setIsRolling(true);
    setLastResult(null);

    try {
      // Use smart contract
      await startGame(diceMode, prediction, stake);

      // For now, simulate dice rolling visually while contract processes
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate visual dice for display (actual results come from contract)
      const visualResults = Array.from({ length: diceMode }, () => Math.floor(Math.random() * 6) + 1);
      setDiceValues(visualResults);

      toast.success("Game started! Resolving dice...", {
        description: "Transaction submitted to blockchain",
      });
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
      // Fallback to demo mode
      await handleRollFallback(stake);
    } finally {
      setIsRolling(false);
    }
  };

  // Fallback function for demo mode
  const handleRollFallback = async (stake: number) => {
    if (stake > rollBalance) {
      toast.error("Insufficient ROLL balance");
      return;
    }

    setIsRolling(true);
    setLastResult(null);

    // Simulate rolling
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate random dice values
    const results = Array.from({ length: diceMode }, () => Math.floor(Math.random() * 6) + 1);
    setDiceValues(results);

    // Calculate win based on prediction
    const sum = results.reduce((a, b) => a + b, 0);
    const isEven = sum % 2 === 0;
    const win = (prediction === "even" && isEven) || (prediction === "odd" && !isEven);
    const payout = win ? stake * 1.95 : 0;

    setLastResult({ win, payout });
    onRoll(stake, { diceValues: results, win, payout });

    setIsRolling(false);

    // Show toast
    const sumType = isEven ? "Even" : "Odd";
    if (win) {
      toast.success(`You won ${payout.toFixed(2)} ROLL! 🎉`, {
        description: `Dice: ${results.join(", ")} (Sum: ${sum} - ${sumType})`,
      });
    } else {
      toast.error(`You lost ${stake} ROLL`, {
        description: `Dice: ${results.join(", ")} (Sum: ${sum} - ${sumType})`,
      });
    }
  };

  const diceSizes = {
    1: 120,
    2: 80,
    3: 60,
  };

  // Swap functionality
  const exchangeRate = 1000; // 1 ETH = 1000 ROLL
  const toToken = fromToken === "ETH" ? "ROLL" : "ETH";
  const toAmount = swapAmount
    ? fromToken === "ETH"
      ? (parseFloat(swapAmount) * exchangeRate).toFixed(2)
      : (parseFloat(swapAmount) / exchangeRate).toFixed(4)
    : "";

  const fromBalance = fromToken === "ETH" ? ethBalance : rollBalance;

  const handleSwap = async () => {
    const amount = parseFloat(swapAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > fromBalance) {
      toast.error(`Insufficient ${fromToken} balance`);
      return;
    }

    setIsSwapping(true);
    onShowOverlay?.("Swapping Tokens...", "Confirming transaction on blockchain", true);

    try {
      if (isContractAvailable && fromToken === "ETH") {
        // Use smart contract for ETH to ROLL swap
        await swapETHForROLL(amount);
        toast.success(`Swapped ${amount} ${fromToken} for ${toAmount} ${toToken}`, {
          description: "Transaction submitted to blockchain",
        });
      } else {
        // Fallback to demo mode
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSwap(fromToken, amount);
        toast.success(`Swapped ${amount} ${fromToken} for ${toAmount} ${toToken}`, {
          description: "Demo transaction completed",
        });
      }

      setSwapAmount("");
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Swap failed. Please try again.");
    } finally {
      setIsSwapping(false);
      onHideOverlay?.();
    }
  };

  const handleFlipTokens = () => {
    setFromToken(fromToken === "ETH" ? "ROLL" : "ETH");
    setSwapAmount("");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Game Section - 70% */}
      <div className="flex-[7] space-y-6">
        {/* Dice Mode Selector */}
        <Card className="bg-[#2a2a2a]/50 backdrop-blur-sm border-[#404040]/50 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#fde047] drop-shadow-[0_0_6px_rgba(253,224,71,0.4)]" />
              <span className="text-[#d4d4d4]">Select Number of Dice</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map(mode => (
                <Button
                  key={mode}
                  onClick={() => {
                    setDiceMode(mode as 1 | 2 | 3);
                    setDiceValues(Array(mode).fill(1));
                  }}
                  variant={diceMode === mode ? "default" : "outline"}
                  className={
                    diceMode === mode
                      ? "bg-gradient-to-r from-[#fde047] via-[#fef3c7] to-[#fed7aa] text-[#1a1a1a] hover:opacity-90 border-2 border-[#fde047] shadow-xl shadow-[#fde047]/50 hover:scale-105 transition-all duration-200"
                      : "bg-[#404040] border-[#404040] hover:border-[#fde047]/50 text-[#d4d4d4] hover:text-[#fef3c7] transition-all duration-200"
                  }
                  size="lg"
                >
                  {mode} {mode === 1 ? "Die" : "Dice"}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Dice Display */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#2a2a2a]/60 to-[#1a1a1a]/40 backdrop-blur-sm border-2 border-[#fde047]/30 p-8 md:p-12 min-h-[300px] shadow-2xl shadow-[#fde047]/10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fde047]/5 via-transparent to-[#fed7aa]/5" />
          <div
            className={`relative flex items-center justify-center gap-6 md:gap-8 h-full ${
              diceMode === 3 ? "flex-wrap" : ""
            }`}
          >
            {diceValues.map((value, index) => (
              <Dice3D
                key={index}
                value={value}
                size={diceSizes[diceMode]}
                isRolling={isRolling}
                showGlow={lastResult?.win && !isRolling}
              />
            ))}
          </div>
        </Card>

        {/* Prediction and Bet Input */}
        <Card className="bg-[#2a2a2a]/50 backdrop-blur-sm border-[#404040]/50 p-6">
          <div className="space-y-4">
            {/* Even/Odd Prediction Buttons */}
            <div className="space-y-2">
              <label className="text-sm text-[#d4d4d4]">Predict Sum</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPrediction("even")}
                  disabled={isRolling}
                  className={`py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 border-2 ${
                    prediction === "even"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400 shadow-xl shadow-green-500/30 scale-[1.02]"
                      : "bg-[#2a2a2a] border-[#404040] text-[#d4d4d4] hover:bg-green-500/10 hover:border-green-500/40 hover:text-green-400"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>EVEN</span>
                    <span className="text-xs opacity-75">2, 4, 6, 8...</span>
                  </div>
                </button>
                <button
                  onClick={() => setPrediction("odd")}
                  disabled={isRolling}
                  className={`py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 border-2 ${
                    prediction === "odd"
                      ? "bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400 shadow-xl shadow-red-500/30 scale-[1.02]"
                      : "bg-[#2a2a2a] border-[#404040] text-[#d4d4d4] hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>ODD</span>
                    <span className="text-xs opacity-75">3, 5, 7, 9...</span>
                  </div>
                </button>
              </div>
              <p className="text-xs text-[#a3a3a3] text-center">
                Predict if the sum of dice will be {prediction.toUpperCase()} • Win 1.95x
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#d4d4d4]">Stake Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  value={stakeAmount}
                  onChange={e => setStakeAmount(e.target.value)}
                  className="pl-12 h-12 bg-[#2a2a2a] border-[#404040] focus:border-[#fde047] text-lg text-[#ffffff] placeholder:text-[#a3a3a3] transition-all duration-200"
                  placeholder="Enter stake amount"
                  disabled={isRolling}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#fde047]" />
                </div>
                <button
                  onClick={() => setStakeAmount((rollBalance / 2).toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-[#fde047]/20 text-[#fde047] hover:bg-[#fde047]/30 transition-colors border border-[#fde047]/30"
                >
                  Half
                </button>
              </div>
              <div className="flex gap-2">
                {[10, 50, 100, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setStakeAmount(amount.toString())}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-[#404040] hover:bg-[#fde047]/20 hover:text-[#fde047] hover:border hover:border-[#fde047]/30 transition-all duration-200 text-[#d4d4d4]"
                    disabled={isRolling}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full h-14 bg-gradient-to-r from-[#fde047] via-[#fef3c7] to-[#fed7aa] text-[#1a1a1a] text-lg font-bold hover:scale-105 hover:shadow-2xl hover:shadow-[#fde047]/40 transition-all duration-200 disabled:opacity-50 disabled:scale-100 shadow-xl shadow-[#fde047]/30 border-2 border-[#fde047]/50"
            >
              {isRolling ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                  Rolling...
                </span>
              ) : (
                "🎲 Roll Dice"
              )}
            </Button>
          </div>
        </Card>

        {/* Last Result */}
        {lastResult && (
          <Card
            className={`bg-[#2a2a2a]/50 backdrop-blur-sm p-4 border-2 ${
              lastResult.win
                ? "border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20"
                : "border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/20"
            } animate-[slideInRight_0.5s_ease-out]`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`text-2xl ${lastResult.win ? "text-green-500" : "text-red-500"}`}>
                  {lastResult.win ? "✅" : "❌"}
                </div>
                <div>
                  <div className="font-semibold text-[#ffffff]">{lastResult.win ? "You Won!" : "You Lost"}</div>
                  <div className="text-sm text-[#d4d4d4]">
                    Sum: {diceValues.reduce((a, b) => a + b, 0)} (
                    {diceValues.reduce((a, b) => a + b, 0) % 2 === 0 ? "Even" : "Odd"})
                  </div>
                </div>
              </div>
              {lastResult.win && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">+{lastResult.payout.toFixed(2)}</div>
                  <div className="text-sm text-[#d4d4d4]">ROLL</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Game Rules */}
        <Card className="bg-[#2a2a2a]/30 backdrop-blur-sm border-[#404040]/30 p-4 hover:border-[#fde047]/20 transition-all duration-200">
          <div className="text-sm text-[#d4d4d4] space-y-1">
            <div className="font-semibold text-[#fde047] mb-2 flex items-center gap-2">
              <span className="text-lg">📜</span> Game Rules:
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#fde047] mt-0.5">•</span>
              <span>Roll 1-3 dice and bet ROLL tokens</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#fde047] mt-0.5">•</span>
              <span>
                Predict if sum is <span className="text-green-400 font-semibold">EVEN</span> or{" "}
                <span className="text-red-400 font-semibold">ODD</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#fde047] mt-0.5">•</span>
              <span>
                Correct prediction wins <span className="text-[#fef3c7] font-semibold">1.95x payout</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#fde047] mt-0.5">•</span>
              <span>
                All rolls are encrypted using <span className="text-[#fef3c7] font-semibold">FHEVM technology</span> 🔒
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Swap Section - 30% */}
      <div className="flex-[3]">
        <Card className="bg-gradient-to-br from-[#2a2a2a]/60 to-[#1a1a1a]/40 backdrop-blur-sm border-2 border-[#fde047]/30 p-6 shadow-2xl shadow-[#fde047]/10 lg:sticky lg:top-24">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownUp className="h-5 w-5 text-[#fde047] drop-shadow-[0_0_6px_rgba(253,224,71,0.4)]" />
              <h3 className="font-semibold text-[#fde047]">Token Swap</h3>
            </div>

            {/* Mint Tokens for Testing (only show if contract available) */}
            {isContractAvailable && (
              <div className="p-4 bg-[#1a1a1a]/50 rounded-lg border border-[#404040]/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#d4d4d4]">Test Tokens</p>
                    <p className="text-xs text-[#a3a3a3]">Mint ROLL tokens for testing</p>
                  </div>
                  <Button
                    onClick={() => mintTokens(1000)}
                    disabled={isContractLoading}
                    className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white"
                  >
                    {isContractLoading ? "Minting..." : "Mint 1000 ROLL"}
                  </Button>
                </div>
              </div>
            )}

            {/* Contract Status */}
            {!isContractAvailable && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-orange-400">⚠️ Demo Mode - Smart contract not available</p>
              </div>
            )}

            {contractError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">❌ {contractError}</p>
              </div>
            )}

            {/* From Token */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#d4d4d4]">From</label>
                <span className="text-sm text-[#a3a3a3]">
                  Balance: {fromBalance.toFixed(fromToken === "ETH" ? 4 : 2)} {fromToken}
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={swapAmount}
                  onChange={e => setSwapAmount(e.target.value)}
                  className="h-14 text-xl pr-24 bg-[#2a2a2a] border-[#404040] focus:border-[#fde047] text-[#ffffff] placeholder:text-[#a3a3a3]"
                  placeholder="0.0"
                  disabled={isSwapping}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#404040] px-3 py-2 rounded-lg">
                  {fromToken === "ETH" ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                        fill="currentColor"
                        className="text-[#fde047]"
                      />
                    </svg>
                  ) : (
                    <Coins className="h-5 w-5 text-[#fde047]" />
                  )}
                  <span className="font-semibold text-[#ffffff]">{fromToken}</span>
                </div>
              </div>
              <button
                onClick={() => setSwapAmount(fromBalance.toString())}
                className="text-xs px-2 py-1 rounded bg-[#fde047]/20 text-[#fde047] hover:bg-[#fde047]/30 transition-colors border border-[#fde047]/30"
              >
                Max
              </button>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <button
                onClick={handleFlipTokens}
                className="p-2 rounded-full bg-[#404040] hover:bg-[#fde047]/20 transition-all hover:rotate-180 duration-300 border-2 border-[#404040] hover:border-[#fde047]/50"
                disabled={isSwapping}
              >
                <ArrowDownUp className="h-6 w-6 text-[#fde047]" />
              </button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#d4d4d4]">To</label>
                <span className="text-sm text-[#a3a3a3]">Rate: 1 ETH = {exchangeRate} ROLL</span>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  value={toAmount}
                  className="h-14 text-xl pr-24 bg-[#2a2a2a] border-[#404040] text-[#ffffff]"
                  placeholder="0.0"
                  disabled
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#404040] px-3 py-2 rounded-lg">
                  {toToken === "ETH" ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                        fill="currentColor"
                        className="text-[#fde047]"
                      />
                    </svg>
                  ) : (
                    <Coins className="h-5 w-5 text-[#fde047]" />
                  )}
                  <span className="font-semibold text-[#ffffff]">{toToken}</span>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={isSwapping || !swapAmount}
              className="w-full h-12 bg-gradient-to-r from-[#fde047] via-[#fbbf24] to-[#f59e0b] text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg shadow-[#fde047]/30"
            >
              Swap Tokens
            </Button>
          </div>
        </Card>
      </div>

      {isRolling && <LoadingOverlay message="Rolling Dice..." description="Generating encrypted dice results" />}
      {isSwapping && <LoadingOverlay message="Swapping Tokens..." description="Confirming transaction on blockchain" />}
      {isContractLoading && <LoadingOverlay message="Processing..." description="Interacting with smart contract" />}
    </div>
  );
}
