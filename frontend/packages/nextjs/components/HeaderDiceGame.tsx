import { useState, useRef, useEffect } from "react";
import {
  Wallet,
  Dices,
  ChevronDown,
  LogOut,
  RefreshCw,
  Coins,
  Home,
} from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  walletConnected: boolean;
  onWalletConnect: () => void;
  walletAddress?: string;
  ethBalance?: number;
  rollBalance?: number;
  onDisconnect?: () => void;
  onSwitchAccount?: () => void;
}

export function HeaderDiceGame({
  currentPage,
  onNavigate,
  walletConnected,
  onWalletConnect,
  walletAddress,
  ethBalance = 0,
  rollBalance = 0,
  onDisconnect,
  onSwitchAccount,
}: HeaderProps) {
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDisconnect = () => {
    setShowWalletMenu(false);
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const handleSwitchAccount = () => {
    setShowWalletMenu(false);
    if (onSwitchAccount) {
      onSwitchAccount();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-black/40 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - Left */}
        <button
          onClick={() => onNavigate("Home")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <Dices className="h-8 w-8 text-[#fde047] drop-shadow-[0_0_8px_rgba(253,224,71,0.4)]" />
          </div>
          <span className="bg-gradient-to-r from-[#fde047] via-[#fef3c7] to-[#fed7aa] bg-clip-text text-transparent text-xl font-bold drop-shadow-sm">
            Encrypted Dice Roll
          </span>
        </button>

        {/* Navigation - Center */}
        <nav className="hidden md:flex items-center gap-1">
          {["Home", "Game", "History", "Docs"].map((page) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                currentPage === page
                  ? "bg-gradient-to-r from-[#fde047]/20 to-[#fed7aa]/20 text-[#fde047] border border-[#fde047]/30 shadow-lg shadow-[#fde047]/10"
                  : "text-[#d4d4d4] hover:bg-[#404040]/50 hover:text-[#fef3c7]"
              }`}
            >
              {page === "Home" && <Home className="h-4 w-4" />}
              {page}
            </button>
          ))}
        </nav>

        {/* Wallet Button - Right */}
        <div className="relative" ref={menuRef}>
          {walletConnected ? (
            <div>
              <Button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                onMouseEnter={() => setShowWalletMenu(true)}
                variant="outline"
                className="bg-[#2a2a2a] border-[#404040]/50 hover:bg-[#2a2a2a]/80 hover:border-[#fde047]/50 transition-all duration-200"
              >
                <Wallet className="mr-2 h-4 w-4 text-[#fde047]" />
                <span className="text-[#ffffff]">
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </span>
                <ChevronDown
                  className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                    showWalletMenu ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {/* Wallet Submenu Dropdown */}
              {showWalletMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-[#2a2a2a] border border-[#404040]/50 rounded-xl shadow-2xl overflow-hidden animate-[slideDown_0.2s_ease-out]"
                  onMouseLeave={() => setShowWalletMenu(false)}
                >
                  {/* Wallet Address Section */}
                  <div className="p-4 border-b border-[#404040]/50 bg-[#1a1a1a]/50">
                    <p className="text-xs text-[#a3a3a3] mb-2">
                      Connected Wallet
                    </p>
                    <p className="font-mono text-sm text-[#ffffff] break-all">
                      {walletAddress}
                    </p>
                  </div>

                  {/* Balances Section */}
                  <div className="p-4 space-y-3 border-b border-[#404040]/50">
                    {/* Sepolia ETH Balance */}
                    <div className="flex items-center justify-between p-3 bg-[#1a1a1a]/30 rounded-lg border border-[#404040]/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#fbbf24]/10 rounded-lg">
                          <svg
                            className="h-5 w-5 text-[#fbbf24]"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-[#a3a3a3]">Sepolia ETH</p>
                          <p className="font-semibold text-[#ffffff]">
                            {ethBalance.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ROLL Token Balance */}
                    <div className="flex items-center justify-between p-3 bg-[#1a1a1a]/30 rounded-lg border border-[#404040]/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#fde047]/10 rounded-lg">
                          <Coins className="h-5 w-5 text-[#fde047]" />
                        </div>
                        <div>
                          <p className="text-xs text-[#a3a3a3]">ROLL Token</p>
                          <p className="font-semibold text-[#ffffff]">
                            {rollBalance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="p-2">
                    <button
                      onClick={handleSwitchAccount}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#404040]/50 hover:scale-105 transition-all duration-200 text-left group"
                    >
                      <RefreshCw className="h-4 w-4 text-[#fde047] group-hover:text-[#fef3c7]" />
                      <span className="text-sm text-[#ffffff] group-hover:text-[#fef3c7]">
                        Switch Account
                      </span>
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500">Disconnect</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={onWalletConnect}
              className="bg-gradient-to-r from-[#fde047] to-[#fbbf24] text-black hover:opacity-90 shadow-lg shadow-[#fde047]/30"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-center gap-1 pb-3 px-4">
        {["Home", "Game", "History", "Docs"].map((page) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-1 ${
              currentPage === page
                ? "bg-gradient-to-r from-[#fde047]/20 to-[#fed7aa]/20 text-[#fde047] border border-[#fde047]/30"
                : "text-[#d4d4d4] hover:bg-[#404040]/50"
            }`}
          >
            {page === "Home" && <Home className="h-3 w-3" />}
            {page}
          </button>
        ))}
      </nav>
    </header>
  );
}
