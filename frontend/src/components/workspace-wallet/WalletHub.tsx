"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  BarChart3,
  LayoutDashboard,
  List,
  QrCode,
  Send,
} from "lucide-react";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import { useWalletStore } from "@/lib/walletStore";
import { getWalletCurrencyLabel } from "@/lib/walletCurrencies";
import { Analytics } from "./Analytics";
import { ReceiveMoney } from "./ReceiveMoney";
import { SendMoney } from "./SendMoney";
import { Transactions } from "./Transactions";
import { WalletDashboard } from "./WalletDashboard";
import { Withdraw } from "./Withdraw";

type WalletTab =
  | "dashboard"
  | "send"
  | "receive"
  | "withdraw"
  | "transactions"
  | "analytics";

const TABS: Array<{ id: WalletTab; label: string; icon: React.ReactNode }> = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "send", label: "Send", icon: <Send className="h-4 w-4" /> },
  { id: "receive", label: "Receive", icon: <QrCode className="h-4 w-4" /> },
  { id: "withdraw", label: "Withdraw", icon: <ArrowDownToLine className="h-4 w-4" /> },
  { id: "transactions", label: "Transactions", icon: <List className="h-4 w-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
];

export function WalletHub() {
  const [activeTab, setActiveTab] = useState<WalletTab>("dashboard");
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);
  const confettiTrigger = useWalletStore((state) => state.confettiTrigger);
  const selectedCurrency = useWalletStore((state) => state.selectedCurrency);
  const supportedCurrencies = useWalletStore((state) => state.supportedCurrencies);
  const setSelectedCurrency = useWalletStore((state) => state.setSelectedCurrency);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <WalletDashboard onNavigate={setActiveTab} />;
      case "send":
        return <SendMoney />;
      case "receive":
        return <ReceiveMoney />;
      case "withdraw":
        return <Withdraw />;
      case "transactions":
        return <Transactions />;
      case "analytics":
        return <Analytics />;
      default:
        return null;
    }
  };

  return (
    <div className="sheet-shell min-h-screen">
      <ConfettiCelebration trigger={confettiTrigger} />
      <div className="sheet-container">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="overflow-x-auto">
            <div className="flex min-w-full gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 sm:min-w-0 sm:w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-[var(--accent)] hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm">
            <span className="text-muted-foreground">Wallet currency</span>
            <select
              value={selectedCurrency}
              onChange={(event) => setSelectedCurrency(event.target.value as typeof selectedCurrency)}
              className="bg-transparent font-medium outline-none"
            >
              {supportedCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {getWalletCurrencyLabel(currency)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
