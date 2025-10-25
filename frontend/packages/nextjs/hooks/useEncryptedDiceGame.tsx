import { useCallback, useEffect, useMemo, useState } from "react";
import { EncryptedDiceGameABI } from "../abi/EncryptedDiceGameABI";
import { getEncryptedDiceGameAddress } from "../contracts/EncryptedDiceGameAddresses";
import { useWagmiEthers } from "./wagmi/useWagmiEthers";
import { buildParamsFromAbi, useFHEDecrypt, useFHEEncryption, useFhevm, useInMemoryStorage } from "@fhevm-sdk";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export type GameRecord = {
  id: number;
  diceCount: number;
  prediction: "even" | "odd";
  stake: number;
  result?: number[];
  won?: boolean;
  payout?: number;
  timestamp: number;
  isResolved: boolean;
};

export function useEncryptedDiceGame() {
  const { address: walletAddress, chainId } = useAccount();

  // Get provider from window
  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum;
  }, []);

  // Get ethers providers
  const initialMockChains = { 31337: "http://localhost:8545" };
  const {
    chainId: wagmiChainId,
    accounts,
    isConnected,
    ethersReadonlyProvider,
    ethersSigner,
  } = useWagmiEthers(initialMockChains);

  // Storage for decryption signatures
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  // Get FHEVM instance with proper configuration
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: Boolean(chainId),
  });

  // Contract info
  const contractAddress = chainId ? getEncryptedDiceGameAddress(chainId) : undefined;

  // Wagmi hooks
  const { writeContract, data: writeData, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTransactionLoading } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // FHE Encryption hook
  const { encryptWith } = useFHEEncryption({
    instance: fhevmInstance,
    ethersSigner: ethersSigner as any,
    contractAddress: contractAddress as `0x${string}`,
  });

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);

  // Read encrypted balance
  const { data: encryptedBalance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: EncryptedDiceGameABI,
    functionName: "getBalance",
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: Boolean(walletAddress && contractAddress),
    },
  });

  // Read game counter
  const { data: gameCounter, refetch: refetchGameCounter } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: EncryptedDiceGameABI,
    functionName: "gameCounter",
    query: {
      enabled: Boolean(contractAddress),
    },
  });

  // FHE Decryption requests (define after encryptedBalance)
  const decryptRequests = useMemo(() => {
    if (!contractAddress || !encryptedBalance || encryptedBalance === 0n) return [];
    return [{ handle: encryptedBalance.toString(), contractAddress: contractAddress as `0x${string}` }];
  }, [contractAddress, encryptedBalance]);

  // FHE Decryption hook
  const {
    canDecrypt,
    decrypt,
    isDecrypting,
    results: decryptResults,
  } = useFHEDecrypt({
    instance: fhevmInstance,
    ethersSigner: ethersSigner,
    fhevmDecryptionSignatureStorage,
    chainId,
    requests: decryptRequests,
  });

  // Mint tokens for testing
  const mintTokens = useCallback(
    async (amount: number) => {
      if (!contractAddress || !walletAddress) {
        setError("Contract not found or wallet not connected");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const amountWei = parseEther(amount.toString());

        writeContract({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "mintTokens",
          args: [amountWei],
        });
      } catch (err) {
        console.error("Error minting tokens:", err);
        setError(err instanceof Error ? err.message : "Failed to mint tokens");
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, writeContract],
  );

  // Swap ETH for ROLL tokens
  const swapETHForROLL = useCallback(
    async (ethAmount: number) => {
      if (!contractAddress || !walletAddress) {
        setError("Contract not found or wallet not connected");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const valueWei = parseEther(ethAmount.toString());

        writeContract({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "swapETHForROLL",
          value: valueWei,
        });
      } catch (err) {
        console.error("Error swapping ETH for ROLL:", err);
        setError(err instanceof Error ? err.message : "Failed to swap tokens");
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, writeContract],
  );

  // Start encrypted game
  const startGame = useCallback(
    async (diceCount: number, prediction: "even" | "odd", stakeAmount: number) => {
      if (!contractAddress || !walletAddress || !encryptWith) {
        setError("Contract, wallet, or encryption not available");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Encrypt prediction (0 = even, 1 = odd)
        const predictionValue = prediction === "even" ? 0 : 1;
        const encryptedPrediction = await encryptWith(builder => {
          builder.add8(predictionValue);
        });

        if (!encryptedPrediction) {
          setError("Failed to encrypt prediction");
          return;
        }

        // Encrypt stake amount
        const stakeWei = parseEther(stakeAmount.toString());
        const encryptedStake = await encryptWith(builder => {
          builder.add256(stakeWei);
        });

        if (!encryptedStake) {
          setError("Failed to encrypt stake");
          return;
        }

        writeContract({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "startGame",
          args: [
            diceCount,
            ("0x" + Buffer.from(encryptedPrediction.handles[0]).toString("hex")) as `0x${string}`,
            ("0x" + Buffer.from(encryptedPrediction.inputProof).toString("hex")) as `0x${string}`,
            ("0x" + Buffer.from(encryptedStake.handles[0]).toString("hex")) as `0x${string}`,
            ("0x" + Buffer.from(encryptedStake.inputProof).toString("hex")) as `0x${string}`,
          ],
        });

        // Add to local game history (will be updated when resolved)
        const newGame: GameRecord = {
          id: Number(gameCounter || 0),
          diceCount,
          prediction,
          stake: stakeAmount,
          timestamp: Date.now(),
          isResolved: false,
        };

        setGameHistory(prev => [newGame, ...prev]);
      } catch (err) {
        console.error("Error starting game:", err);
        setError(err instanceof Error ? err.message : "Failed to start game");
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, encryptWith, writeContract, gameCounter],
  );

  // Resolve game
  const resolveGame = useCallback(
    async (gameId: number) => {
      if (!contractAddress || !walletAddress) {
        setError("Contract not found or wallet not connected");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        writeContract({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "resolveGame",
          args: [BigInt(gameId)],
        });
      } catch (err) {
        console.error("Error resolving game:", err);
        setError(err instanceof Error ? err.message : "Failed to resolve game");
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, writeContract],
  );

  // Decrypt balance - use FHE decrypt hook
  const decryptBalance = useCallback((): number | null => {
    if (!encryptedBalance || !decryptResults) {
      return null;
    }

    try {
      const balanceHandle = encryptedBalance.toString();
      const decrypted = decryptResults[balanceHandle];
      if (typeof decrypted === "undefined") return null;

      return parseFloat(formatEther(BigInt(decrypted)));
    } catch (err) {
      console.error("Error getting decrypted balance:", err);
      return null;
    }
  }, [encryptedBalance, decryptResults]);

  // Get game details
  const getGameDetails = useCallback(
    async (gameId: number) => {
      if (!contractAddress) return null;

      try {
        // This would need to be implemented as a contract read
        // For now, return from local state
        return gameHistory.find(game => game.id === gameId) || null;
      } catch (err) {
        console.error("Error getting game details:", err);
        return null;
      }
    },
    [contractAddress, gameHistory],
  );

  // Refresh data
  const refresh = useCallback(async () => {
    await Promise.all([refetchBalance(), refetchGameCounter()]);
  }, [refetchBalance, refetchGameCounter]);

  // Auto-refresh on transaction completion
  useEffect(() => {
    if (writeData && !isTransactionLoading) {
      setTimeout(refresh, 2000); // Refresh after 2 seconds
    }
  }, [writeData, isTransactionLoading, refresh]);

  return {
    // State
    isLoading: isLoading || isWritePending || isTransactionLoading,
    error,
    gameHistory,
    encryptedBalance,
    gameCounter: Number(gameCounter || 0),

    // Contract info
    contractAddress: contractAddress,
    isContractAvailable: Boolean(contractAddress),

    // Actions
    mintTokens,
    swapETHForROLL,
    startGame,
    resolveGame,
    decryptBalance,
    getGameDetails,
    refresh,

    // Utils
    clearError: () => setError(null),
  };
}
