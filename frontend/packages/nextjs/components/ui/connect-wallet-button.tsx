"use client";

import { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ConnectWalletButtonProps {
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  className?: string;
  icon?: ReactNode;
  onConnected?: () => void;
}

/**
 * Reusable Connect Wallet Button using RainbowKit
 * Maintains consistent wallet connection across the app
 */
export const ConnectWalletButton = ({
  label = "Connect Wallet",
  size = "default",
  variant = "default",
  className,
  icon,
  onConnected,
}: ConnectWalletButtonProps) => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        // If wallet is connected, execute callback if provided
        if (connected && onConnected) {
          onConnected();
        }

        // Only show connect button if not connected
        if (!connected) {
          return (
            <Button onClick={openConnectModal} size={size} variant={variant} className={cn(className)} type="button">
              {icon}
              {label}
            </Button>
          );
        }

        // If connected, return null (parent component handles connected state)
        return null;
      }}
    </ConnectButton.Custom>
  );
};
