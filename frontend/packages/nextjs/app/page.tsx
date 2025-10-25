"use client";

import { useEffect, useState } from "react";
import { BalanceCards } from "../components/BalanceCards";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { Documentation } from "../components/Documentation";
import { Footer } from "../components/Footer";
import { GameHistory } from "../components/GameHistory";
import { GameInterface } from "../components/GameInterface";
import { HeaderDiceGame } from "../components/HeaderDiceGame";
import { LandingPage } from "../components/LandingPage";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Toaster } from "../components/ui/sonner";
import { useAccount } from "wagmi";

interface GameRecord {
  id: string;
  timestamp: Date;
  diceMode: number;
  diceValues: number[];
  stake: number;
  result: "win" | "loss";
  payout: number;
}

export default function Home() {
  const { address, isConnected } = useAccount();

  const [currentPage, setCurrentPage] = useState<string>("Home");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [rollBalance, setRollBalance] = useState(1000);
  const [ethBalance, setEthBalance] = useState(5.0);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);

  // Update wallet state when account changes
  useEffect(() => {
    setWalletConnected(isConnected);
    setWalletAddress(address);
  }, [isConnected, address]);

  // Global overlay state for child components (e.g., TokenSwap in GameInterface)
  const [globalOverlay, setGlobalOverlay] = useState<{
    visible: boolean;
    message?: string;
    description?: string;
    showDice?: boolean;
  }>({ visible: false });

  const showOverlay = (message: string, description?: string, showDice: boolean = true) => {
    setGlobalOverlay({ visible: true, message, description, showDice });
  };

  const hideOverlay = () => {
    setGlobalOverlay(prev => ({ ...prev, visible: false }));
  };

  const handleWalletDisconnect = () => {
    // Wallet disconnection is now handled by the wallet provider
    // Just navigate back to home if needed
    setCurrentPage("Home");
  };

  const handleNavigate = async (page: string) => {
    // If already on the current page, do nothing
    if (page === currentPage) return;

    // If wallet connection is required first
    if (page === "Game" && !walletConnected) {
      // Wallet connection is now handled by ConnectWalletButton
      return;
    }

    // Start loading
    setIsNavigating(true);
    setNavigationTarget(page);

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 800));

    // Switch page
    setCurrentPage(page);

    // End loading
    setIsNavigating(false);
    setNavigationTarget(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {isConnecting && (
        <LoadingOverlay message="Connecting to Wallet..." description="Please approve in MetaMask" showDice={true} />
      )}

      {/* Navigation Loading */}
      {isNavigating && (
        <LoadingOverlay
          message={`Loading ${navigationTarget}...`}
          description={`Preparing ${navigationTarget?.toLowerCase()} interface`}
          showDice={true}
        />
      )}

      {/* Global Loading Overlay (for actions like TokenSwap) */}
      {globalOverlay.visible && (
        <LoadingOverlay
          message={globalOverlay.message}
          description={globalOverlay.description}
          showDice={globalOverlay.showDice}
        />
      )}

      <HeaderDiceGame
        currentPage={currentPage}
        onNavigate={handleNavigate}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        ethBalance={ethBalance}
        rollBalance={rollBalance}
        onDisconnect={handleWalletDisconnect}
      />

      {/* Hero Section - Full Width */}
      {currentPage === "Home" && (
        <div className="w-full">
          <LandingPage onNavigate={handleNavigate} />
        </div>
      )}

      <main className="container mx-auto px-4 ">
        <BreadcrumbNav currentPage={currentPage} onNavigate={handleNavigate} />

        {currentPage === "Game" && (
          <div className="space-y-8">
            <BalanceCards />
            <GameInterface onShowOverlay={showOverlay} onHideOverlay={hideOverlay} />
          </div>
        )}

        {currentPage === "History" && <GameHistory />}

        {currentPage === "Docs" && <Documentation onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />

      <Toaster position="top-right" />
    </div>
  );
}
