"use client";
import { useState } from "react";
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

interface GameRecord {
  id: string;
  timestamp: Date;
  diceMode: number;
  diceValues: number[];
  bet: number;
  result: "win" | "loss";
  payout: number;
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<string>("Home");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [rollBalance, setRollBalance] = useState(1000);
  const [ethBalance, setEthBalance] = useState(5.0);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);

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

  const handleWalletConnect = async () => {
    if (!walletConnected) {
      setIsConnecting(true);
      // Simulate wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setWalletConnected(true);
      setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
      setIsConnecting(false);

      if (currentPage === "Home") {
        setCurrentPage("Game");
      }
    }
  };

  const handleWalletDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress(undefined);
    setCurrentPage("Home");
  };

  const handleSwitchAccount = () => {
    // Simulate switching to different accounts
    const accounts = [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
      "0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C",
    ];
    const currentIndex = accounts.indexOf(walletAddress || "");
    const nextIndex = (currentIndex + 1) % accounts.length;
    setWalletAddress(accounts[nextIndex]);
  };

  const handleRoll = (bet: number, result: { diceValues: number[]; win: boolean; payout: number }) => {
    // Update balance
    if (result.win) {
      setRollBalance(prev => prev - bet + result.payout);
    } else {
      setRollBalance(prev => prev - bet);
    }

    // Add to history
    const record: GameRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      diceMode: result.diceValues.length,
      diceValues: result.diceValues,
      bet,
      result: result.win ? "win" : "loss",
      payout: result.payout,
    };
    setGameHistory(prev => [...prev, record]);
  };

  const handleSwap = (fromToken: "ETH" | "ROLL", amount: number) => {
    const exchangeRate = 1000;
    if (fromToken === "ETH") {
      setEthBalance(prev => prev - amount);
      setRollBalance(prev => prev + amount * exchangeRate);
    } else {
      setRollBalance(prev => prev - amount);
      setEthBalance(prev => prev + amount / exchangeRate);
    }
  };

  const handleNavigate = async (page: string) => {
    // If already on the current page, do nothing
    if (page === currentPage) return;
    
    // If wallet connection is required first
    if (page === "Game" && !walletConnected) {
      handleWalletConnect();
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
      {isConnecting && 
      <LoadingOverlay 
      message="Connecting to Wallet..." 
      description="Please approve in MetaMask" 
      showDice={true} 
      />}
      
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
        onWalletConnect={handleWalletConnect}
        walletAddress={walletAddress}
        ethBalance={ethBalance}
        rollBalance={rollBalance}
        onDisconnect={handleWalletDisconnect}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* Hero Section - Full Width */}
      {currentPage === "Home" && (
        <div className="w-full">
          <LandingPage onConnectWallet={handleWalletConnect} onNavigate={handleNavigate} />
        </div>
      )}

      <main className="container mx-auto px-4 ">
        <BreadcrumbNav currentPage={currentPage} onNavigate={handleNavigate} />

        {currentPage === "Game" && (
          <div className="space-y-8">
            <BalanceCards rollBalance={rollBalance} ethBalance={ethBalance} />
            <GameInterface
              rollBalance={rollBalance}
              ethBalance={ethBalance}
              onRoll={handleRoll}
              onSwap={handleSwap}
              onShowOverlay={showOverlay}
              onHideOverlay={hideOverlay}
            />
          </div>
        )}

        {currentPage === "History" && <GameHistory records={gameHistory} />}

        {currentPage === "Docs" && <Documentation onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />

      <Toaster position="top-right" />
    </div>
  );
}
