import "@rainbow-me/rainbowkit/styles.css";
import { DappWrapperWithProviders } from "~~/components/DappWrapperWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globalsFHECounter.css";
import { getMetadata } from "~~/utils/helper/getMetadata";

export const metadata = getMetadata({
  title: "FHE Counter - Zama Template",
  description: "Built with FHEVM",
});

export default function CounterLayout({ children }: { children: React.ReactNode }) {
  return (
    <DappWrapperWithProviders>
      <ThemeProvider enableSystem>{children}</ThemeProvider>
    </DappWrapperWithProviders>
  );
}
