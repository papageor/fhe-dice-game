/**
 * Contract addresses for EncryptedDiceGame across different networks
 * Generated from deployment results
 */

export const EncryptedDiceGameAddresses = {
  // Hardhat Local Network (Chain ID: 31337)
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3",

  // Add other networks as needed
  // 11155111: "0x...", // Sepolia Testnet
  // 1: "0x...", // Ethereum Mainnet
} as const;

export type SupportedChainId = keyof typeof EncryptedDiceGameAddresses;

/**
 * Get contract address for the given chain ID
 * @param chainId - The chain ID to get the address for
 * @returns The contract address or undefined if not deployed on that chain
 */
export function getEncryptedDiceGameAddress(chainId: number): string | undefined {
  return EncryptedDiceGameAddresses[chainId as SupportedChainId];
}
