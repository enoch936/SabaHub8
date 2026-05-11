"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Building2, CheckCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { convertWalletAmount, getWalletCurrencyLabel } from "@/lib/walletCurrencies";
import { formatCurrency, formatDate } from "@/lib/walletMetrics";
import { useWalletStore } from "@/lib/walletStore";

export function Withdraw() {
  const balance = useWalletStore((state) => state.balance);
  const transactions = useWalletStore((state) => state.transactions);
  const selectedCurrency = useWalletStore((state) => state.selectedCurrency);
  const supportedCurrencies = useWalletStore((state) => state.supportedCurrencies);
  const setSelectedCurrency = useWalletStore((state) => state.setSelectedCurrency);
  const withdraw = useWalletStore((state) => state.withdraw);

  const [method, setMethod] = useState<"BANK" | "CARD">("BANK");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReference, setSuccessReference] = useState<string | null>(null);

  const currency = balance?.currency ?? selectedCurrency;
  const availableBalance = balance?.available ?? 0;
  const numericAmount = Number.parseFloat(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0;
  const alternateCurrency = currency === "USD" ? "ETB" : "USD";

  const recentWithdrawals = useMemo(
    () => transactions.filter((transaction) => transaction.type === "WITHDRAW").slice(0, 4),
    [transactions],
  );

  const receiveAmount = useMemo(() => {
    if (!validAmount) return 0;
    return validAmount;
  }, [validAmount]);

  const handleWithdraw = async (event: FormEvent) => {
    event.preventDefault();

    if (!validAmount) {
      toast.error("Enter a valid withdrawal amount.");
      return;
    }
    if (validAmount > availableBalance) {
      toast.error("Insufficient available balance.");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Enter a payout destination.");
      return;
    }

    setIsProcessing(true);
    setSuccessReference(null);

    try {
      const tx = await withdraw({
        amount: validAmount,
        method,
        currency,
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim() || undefined,
        accountName: accountName.trim() || undefined,
        cardExpiry: method === "CARD" ? cardExpiry.trim() : undefined,
        cardCvv: method === "CARD" ? cardCvv.trim() : undefined,
      });

      setSuccessReference(tx.reference);
      toast.success("Withdrawal request submitted.");
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Unable to submit withdrawal.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="mb-2">Withdraw Funds</h1>
        <p className="text-muted-foreground">
          Submit an encrypted payout request. Pending withdrawals are reserved immediately and finalized by finance operations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            {successReference ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="mb-2">Withdrawal Submitted</h3>
                <p className="mb-6 max-w-xl text-muted-foreground">
                  Your payout destination was stored in encrypted form and the request is now visible in the admin withdrawal queue.
                </p>
                <div className="w-full max-w-xl space-y-2 rounded-xl bg-muted p-4 text-left">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">{formatCurrency(validAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-semibold">{method === "BANK" ? "Bank transfer" : "Card payout"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono text-sm font-semibold">{successReference}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessReference(null);
                    setAmount("");
                    setAccountNumber("");
                    setBankName("");
                    setAccountName("");
                    setCardExpiry("");
                    setCardCvv("");
                  }}
                  className="mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Submit another withdrawal
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-6">
                <div>
                  <label className="mb-2 block">Currency</label>
                  <select
                    value={currency}
                    onChange={(event) => setSelectedCurrency(event.target.value as typeof currency)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {supportedCurrencies.map((option) => (
                      <option key={option} value={option}>
                        {getWalletCurrencyLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block">Withdrawal Method</label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMethod("BANK")}
                      className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                        method === "BANK" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                        <Building2 className="h-6 w-6 text-blue-700" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Bank Transfer</div>
                        <div className="text-xs text-muted-foreground">Admin-reviewed settlement</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("CARD")}
                      className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                        method === "CARD" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                        <CreditCard className="h-6 w-6 text-violet-700" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Card Payout</div>
                        <div className="text-xs text-muted-foreground">Encrypted destination details</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block">Withdrawal Amount ({currency})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={availableBalance || undefined}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Available balance: {formatCurrency(availableBalance, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAmount(String(availableBalance || 0))}
                      className="text-primary hover:underline"
                    >
                      Withdraw all
                    </button>
                  </div>
                </div>

                {validAmount > 0 ? (
                  <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Cross-currency preview</span>
                      <span className="font-semibold">
                        {formatCurrency(validAmount, currency)} = {formatCurrency(convertWalletAmount(validAmount, currency, alternateCurrency, balance?.fx), alternateCurrency)}
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      The payout request is submitted in {currency} and deducted from the {currency} wallet only.
                    </p>
                  </div>
                ) : null}

                {method === "BANK" ? (
                  <>
                    <div>
                      <label className="mb-2 block">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value)}
                        placeholder="Commercial Bank of Ethiopia"
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value)}
                        placeholder="Enter account number"
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block">Account Holder Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(event) => setAccountName(event.target.value)}
                        placeholder="Account holder"
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-2 block">Card Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(event) => setCardExpiry(event.target.value)}
                          placeholder="MM/YY"
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(event) => setCardCvv(event.target.value)}
                          placeholder="123"
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Submitting withdrawal...</span>
                    </>
                  ) : (
                    <span>Submit Live Withdrawal</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4">Withdrawal Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Requested</span>
                <span className="font-semibold">{formatCurrency(validAmount, currency)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3">
                <span className="font-medium">Estimated payout</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(receiveAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-800 p-6 text-white">
            <h3 className="mb-4">Security</h3>
            <div className="space-y-3 text-sm text-white/85">
              <p>Payout destinations are encrypted before persistence.</p>
              <p>Pending withdrawals reduce available balance immediately to prevent double-spend.</p>
              <p>Completion writes a one-time ledger settlement entry and becomes visible in admin finance tools.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4">Recent Withdrawals</h3>
            <div className="space-y-3">
              {recentWithdrawals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No withdrawal activity yet.</p>
              ) : (
                recentWithdrawals.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium">{transaction.description ?? "Withdrawal"}</div>
                      <div className="text-muted-foreground">{formatDate(transaction.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</div>
                      <div className="text-xs text-muted-foreground">{transaction.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
