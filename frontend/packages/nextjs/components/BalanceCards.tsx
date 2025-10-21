import { TrendingUp, Coins } from "lucide-react";
import { Card } from "./ui/card";

interface BalanceCardsProps {
  rollBalance: number;
  ethBalance: number;
}

export function BalanceCards({ rollBalance, ethBalance }: BalanceCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* ROLL Balance */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-2 border-[#fde047]/30 hover:border-[#fde047]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#fde047]/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fde047]/10 via-[#fef3c7]/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#fde047]/20 to-transparent rounded-full blur-3xl" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#fde047]/30 to-[#fbbf24]/20 border border-[#fde047]/20">
                <Coins className="h-5 w-5 text-[#fde047]" />
              </div>
              <span className="text-[#d4d4d4]">ROLL Balance</span>
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#fde047] via-[#fef3c7] to-[#fed7aa] bg-clip-text text-transparent drop-shadow-sm">
              {rollBalance.toLocaleString()}
            </div>
            <div className="text-sm text-[#a3a3a3] mt-1">
              ≈ ${(rollBalance * 0.001).toFixed(2)} USD
            </div>
          </div>
        </div>
      </Card>

      {/* ETH Balance */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-2 border-[#404040] hover:border-[#fde047]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#404040]/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fed7aa]/5 to-transparent" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#fed7aa]/20 to-[#fbbf24]/10 border border-[#fed7aa]/10">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                    fill="currentColor"
                    className="text-[#fbbf24]"
                  />
                </svg>
              </div>
              <span className="text-[#d4d4d4]">ETH Balance</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-[#ffffff]">
              {ethBalance.toFixed(4)}
            </div>
            <div className="text-sm text-[#a3a3a3] mt-1">
              ≈ ${(ethBalance * 2500).toFixed(2)} USD
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
