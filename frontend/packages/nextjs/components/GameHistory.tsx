import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { LoadingOverlay } from "./LoadingOverlay";

interface GameRecord {
  id: string;
  timestamp: Date;
  diceMode: number;
  diceValues: number[];
  bet: number;
  result: "win" | "loss";
  payout: number;
}

interface GameHistoryProps {
  records: GameRecord[];
}

export function GameHistory({ records }: GameHistoryProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading data from blockchain
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const stats = {
    totalGames: records.length,
    wins: records.filter((r) => r.result === "win").length,
    losses: records.filter((r) => r.result === "loss").length,
    totalWagered: records.reduce((sum, r) => sum + r.bet, 0),
    netProfit: records.reduce((sum, r) => sum + (r.payout - r.bet), 0),
  };

  const winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;

  return (
    <>
      {isLoading && (
        <LoadingOverlay 
          message="Loading History..." 
          description="Fetching your recent games from blockchain"
          showDice={true}
        />
      )}
      
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Games</div>
            <div className="text-2xl font-bold">{stats.totalGames}</div>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
            <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-green-500">{winRate.toFixed(1)}%</div>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Wagered</div>
            <div className="text-2xl font-bold">{stats.totalWagered.toFixed(0)}</div>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
            <div className="text-sm text-muted-foreground mb-1">Net Profit</div>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
              {stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toFixed(2)}
            </div>
          </Card>
        </div>

        {/* History Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Game History</h2>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-2">🎲</div>
                <div>No games played yet</div>
                <div className="text-sm">Start rolling to see your history!</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Time</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Dice</TableHead>
                      <TableHead>Sum</TableHead>
                      <TableHead>Bet</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Profit/Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.slice().reverse().map((record) => {
                      const sum = record.diceValues.reduce((a, b) => a + b, 0);
                      const profitLoss = record.payout - record.bet;

                      return (
                        <TableRow key={record.id} className="border-border hover:bg-secondary/30">
                          <TableCell className="text-muted-foreground">
                            {record.timestamp.toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-secondary/50">
                              {record.diceMode} {record.diceMode === 1 ? "Die" : "Dice"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {record.diceValues.map((val, i) => (
                                <span key={i} className="inline-flex items-center justify-center w-6 h-6 text-xs bg-white text-black rounded border border-gray-300">
                                  {val}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={sum % 2 === 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}>
                              {sum} {sum % 2 === 0 ? "Even" : "Odd"}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.bet.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={record.result === "win" ? "default" : "destructive"}
                              className={record.result === "win" ? "bg-green-500" : ""}
                            >
                              {record.result === "win" ? "Win" : "Loss"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`flex items-center justify-end gap-1 ${profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {profitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              <span className="font-semibold">
                                {profitLoss >= 0 ? "+" : ""}{profitLoss.toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

        {/* Info */}
        <Card className="bg-card/30 backdrop-blur-sm border-border/30 p-4">
          <div className="text-sm text-muted-foreground">
            All game results are stored on-chain and encrypted using FHEVM technology for fairness and transparency. 🔒
          </div>
        </Card>
      </div>
    </>
  );
}
