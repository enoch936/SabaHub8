"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWallet, initChapa, internalWalletTransfer, localTopupRequest, type WalletTransaction } from "@/lib/api";
import { Card, Badge, Button, Input, Select, Progress, Skeleton } from "@/components/ui";

export default function WalletPage() {
  const qc = useQueryClient();
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: getWallet });

  const [amount, setAmount] = useState<number>(500);
  const [currency, setCurrency] = useState<string>("ETB");
  const [referenceId, setReferenceId] = useState<string>("");
  const [method, setMethod] = useState<"chapa" | "local">("chapa");
  const [recipient, setRecipient] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<number>(100);
  const [transferNote, setTransferNote] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  const chapa = useMutation({
    mutationFn: () => initChapa({ amount, currency }, crypto.randomUUID()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  });

  const localReq = useMutation({
    mutationFn: () => localTopupRequest({ amount, currency, referenceId }, crypto.randomUUID()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  });

  const transfer = useMutation({
    mutationFn: () =>
      internalWalletTransfer(
        { recipient, amount: transferAmount, currency, note: transferNote },
        crypto.randomUUID()
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      setRecipient("");
      setTransferNote("");
      setTransferAmount(100);
    },
  });

  const balance = wallet.data?.balance ?? 0;
  const availableBalance = wallet.data?.availableBalance ?? balance;
  const currencyLabel = wallet.data?.currency ?? currency;
  const userId = wallet.data?.userId?.trim() ?? "";

  const transactions: WalletTransaction[] = wallet.data?.transactions ?? [];
  const activity = useMemo(() => {
    const income = transactions
      .filter((t) => t.direction === "IN")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = transactions
      .filter((t) => t.direction === "OUT")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const topCards = [
    { label: "Wallet Balance", value: `${currencyLabel} ${balance.toLocaleString()}`, color: "from-sky-500 to-blue-600" },
    { label: "Income (30d)", value: `${currencyLabel} ${activity.income.toLocaleString()}`, color: "from-emerald-500 to-emerald-600" },
    { label: "Spend (30d)", value: `${currencyLabel} ${activity.expense.toLocaleString()}`, color: "from-amber-500 to-orange-500" },
    { label: "Net", value: `${currencyLabel} ${activity.net.toLocaleString()}`, color: activity.net >= 0 ? "from-emerald-500 to-emerald-600" : "from-rose-500 to-rose-600" },
  ];

  const spendBreakdown = useMemo(() => {
    const buckets: Record<string, number> = {};
    transactions.forEach((t) => {
      const categoryFromMetadata =
        t.metadata && typeof t.metadata === "object" && "category" in t.metadata
          ? String((t.metadata as Record<string, unknown>).category ?? "")
          : "";
      const cat = categoryFromMetadata || t.reason || "Other";
      buckets[cat] = (buckets[cat] || 0) + (t.amount || 0);
    });
    return Object.entries(buckets)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const loading = wallet.isLoading;

  const handleTopup = () => {
    if (method === "chapa") return chapa.mutate();
    return localReq.mutate();
  };

  const copyUserId = async () => {
    if (!userId) {
      setCopyStatus("error");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(userId);
      } else if (typeof document !== "undefined") {
        const el = document.createElement("textarea");
        el.value = userId;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      } else {
        throw new Error("Clipboard not available");
      }
      setCopyStatus("success");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 p-6 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <img src="/images/backgrounds/aurora-blur.svg" alt="Aurora" className="h-full w-full object-cover opacity-75" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <img src="/images/backgrounds/geo-light-grid.svg" alt="Grid" className="h-full w-full object-cover opacity-55" />
      </div>

      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Wallet</h1>
            <p className="text-slate-600">Manage your wallet and view transactions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">Currency: {currencyLabel}</Badge>
          </div>
        </header>

        {/* Balance + KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="mt-2 h-4 w-32" />
                </Card>
              ))
            : topCards.map((card) => (
                <Card
                  key={card.label}
                  className="relative overflow-hidden rounded-2xl border border-white/25 bg-white/85 p-6 shadow-lg backdrop-blur"
                  variant="elevated"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-30`} />
                  <div className="relative text-slate-900">
                    <p className="text-sm opacity-80">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                  </div>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Balance Card */}
          <Card className="lg:col-span-2 p-6 border border-white/25 bg-white/85 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Available Balance</p>
                <p className="text-4xl font-bold text-slate-900">
                  {currencyLabel} {availableBalance.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">Available for transfer and spending</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Live</Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3 rounded-xl bg-slate-50/90 p-4 border border-slate-200/80">
                <p className="text-sm font-medium text-slate-700">Your User ID</p>
                <p className="text-xs text-slate-500">Use this for SabaHub internal transfers.</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    readOnly
                    value={userId || "User ID unavailable"}
                    onFocus={(e) => e.currentTarget.select()}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyUserId}
                    disabled={!userId}
                    className="sm:w-auto"
                  >
                    Copy ID
                  </Button>
                </div>
                {copyStatus === "success" && <p className="mt-1 text-xs text-emerald-600">User ID copied.</p>}
                {copyStatus === "error" && <p className="mt-1 text-xs text-rose-600">Unable to copy User ID.</p>}
              </div>
              <div className="rounded-xl bg-white/80 p-4 border border-white/30 backdrop-blur">
                <p className="text-sm text-slate-600">Escrow Held</p>
                <p className="text-xl font-semibold text-slate-900">{currencyLabel} {(wallet.data?.escrowHeld ?? 0).toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-white/80 p-4 border border-white/30 backdrop-blur">
                <p className="text-sm text-slate-600">Pending Payouts</p>
                <p className="text-xl font-semibold text-slate-900">{currencyLabel} {(wallet.data?.pendingPayouts ?? 0).toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-white/80 p-4 border border-white/30 backdrop-blur">
                <p className="text-sm text-slate-600">Holds</p>
                <p className="text-xl font-semibold text-slate-900">{currencyLabel} {(wallet.data?.holds ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Top-up Panel */}
          <Card className="p-6 space-y-4 border border-white/25 bg-white/85 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Top-up Wallet</h3>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Amount</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Currency</label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Method</label>
              <Select value={method} onChange={(e) => setMethod(e.target.value as any)}>
                <option value="chapa">Chapa Payment</option>
                <option value="local">Local Transfer</option>
              </Select>
            </div>
            {method === "local" && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Local Reference / Receipt</label>
                <Input
                  placeholder="Upload receipt reference"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                />
              </div>
            )}
            <Button
              onClick={handleTopup}
              isLoading={chapa.isPending || localReq.isPending}
              disabled={!amount || amount <= 0}
              className="w-full"
            >
              {method === "chapa" ? "Pay with Chapa" : "Submit Local Request"}
            </Button>
            {(chapa.error || localReq.error) && (
              <p className="text-sm text-rose-600">{(chapa.error as any)?.message || (localReq.error as any)?.message || "Top-up failed"}</p>
            )}
            {(chapa.isSuccess || localReq.isSuccess) && (
              <p className="text-sm text-emerald-600">Request submitted. Balance will refresh automatically.</p>
            )}

            <div className="border-t border-slate-200/80 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">SabaHub to SabaHub Transfer</h4>
                <Badge variant="info">Internal</Badge>
              </div>
              <Input
                placeholder="Recipient email or user ID"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <Input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
              />
              <Input
                placeholder="Transfer note (optional)"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
              />
              <Button
                onClick={() => transfer.mutate()}
                isLoading={transfer.isPending}
                disabled={!recipient || transferAmount <= 0 || transferAmount > availableBalance}
                className="w-full"
              >
                Send to SabaHub Wallet
              </Button>
              {transfer.error && (
                <p className="text-sm text-rose-600">{(transfer.error as any)?.response?.data?.error || (transfer.error as any)?.message || "Transfer failed"}</p>
              )}
              {transfer.isSuccess && (
                <p className="text-sm text-emerald-600">Transfer completed successfully.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Spending Breakdown */}
          <Card className="p-6 space-y-4 border border-white/25 bg-white/85 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Spending Breakdown</h3>
              <Badge variant="info">Analytics</Badge>
            </div>
            {spendBreakdown.length === 0 && (
              <p className="text-sm text-slate-500">No spend data yet.</p>
            )}
            <div className="space-y-3">
              {spendBreakdown.map((item) => {
                const total = spendBreakdown.reduce((s, i) => s + i.value, 0) || 1;
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">{item.label}</span>
                      <span className="text-slate-600">{pct}%</span>
                    </div>
                    <Progress value={pct} size="sm" />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activity / Net */}
          <Card className="p-6 space-y-4 border border-white/25 bg-white/85 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Activity</h3>
              <Badge variant="success">Live</Badge>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Income</span>
                <span className="font-semibold text-emerald-600">{currencyLabel} {activity.income.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Expense</span>
                <span className="font-semibold text-rose-600">{currencyLabel} {activity.expense.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Net</span>
                <span className={`font-semibold ${activity.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {currencyLabel} {activity.net.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-2 rounded-xl bg-white/80 p-4 text-sm text-slate-600 border border-white/30 backdrop-blur">
              Real-time tracking of escrow releases, payouts, and transaction fees.
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="p-6 space-y-4 border border-white/25 bg-white/85 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
              <Badge variant="info">History</Badge>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {transactions.length === 0 && (
                <p className="text-sm text-slate-500">No transactions yet.</p>
              )}
              {transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-semibold text-slate-900">{t.reason || "Transaction"}</p>
                    <p className="text-xs text-slate-500">{t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${t.direction === "IN" ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.direction === "IN" ? "+" : "-"}{currencyLabel} {(t.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">{t.status || "PENDING"}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
