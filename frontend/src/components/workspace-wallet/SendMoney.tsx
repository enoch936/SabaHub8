"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle, CreditCard, Send, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { initChapa, initStripe } from "@/lib/api";
import { convertWalletAmount, getWalletCurrencyLabel } from "@/lib/walletCurrencies";
import { formatCurrency } from "@/lib/walletMetrics";
import { openHostedPaymentPopup, waitForHostedPaymentResult } from "@/lib/walletPopup";
import { useWalletStore } from "@/lib/walletStore";

type SendMethod = "SABAHUB" | "STRIPE" | "CHAPA";

type SubmissionResult = {
  headline: string;
  body: string;
  amount: number;
  recipient?: string;
  reference?: string;
  provider?: string;
};

const METHOD_COPY: Record<
  SendMethod,
  { label: string; hint: string; icon: React.ReactNode; tone: string; processing: string }
> = {
  SABAHUB: {
    label: "SabaHub",
    hint: "Real wallet-to-wallet transfer using settled SabaHub balance.",
    icon: <Wallet className="h-6 w-6 text-blue-700" />,
    tone: "bg-blue-100",
    processing: "Sending wallet transfer...",
  },
  STRIPE: {
    label: "Stripe",
    hint: "Open a hosted Stripe checkout popup, fund your wallet, then optionally auto-send.",
    icon: <CreditCard className="h-6 w-6 text-violet-700" />,
    tone: "bg-violet-100",
    processing: "Waiting for Stripe checkout...",
  },
  CHAPA: {
    label: "Chapa",
    hint: "Open a hosted Chapa checkout popup, fund your wallet, then optionally auto-send.",
    icon: <Smartphone className="h-6 w-6 text-emerald-700" />,
    tone: "bg-emerald-100",
    processing: "Waiting for Chapa checkout...",
  },
};

export function SendMoney() {
  const balance = useWalletStore((state) => state.balance);
  const selectedCurrency = useWalletStore((state) => state.selectedCurrency);
  const supportedCurrencies = useWalletStore((state) => state.supportedCurrencies);
  const setSelectedCurrency = useWalletStore((state) => state.setSelectedCurrency);
  const sendMoney = useWalletStore((state) => state.sendMoney);
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);

  const [method, setMethod] = useState<SendMethod>("SABAHUB");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const currency = balance?.currency ?? selectedCurrency;
  const numericAmount = Number.parseFloat(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0;
  const alternateCurrency = currency === "USD" ? "ETB" : "USD";
  const convertedAmount = useMemo(
    () => convertWalletAmount(validAmount, currency, alternateCurrency, balance?.fx),
    [alternateCurrency, balance?.fx, currency, validAmount],
  );

  const summary = useMemo(() => {
    if (!validAmount) {
      return {
        primary: formatCurrency(0, currency),
        secondary: method === "SABAHUB" ? "Ready to send from wallet" : "Ready to fund via hosted checkout",
      };
    }

    if (method === "SABAHUB") {
      return {
        primary: formatCurrency(validAmount, currency),
        secondary: "Debited instantly from available wallet balance",
      };
    }

    return {
      primary: formatCurrency(validAmount, currency),
      secondary: recipient.trim()
        ? "Funds your wallet first, then auto-sends to the recipient"
        : "Funds your wallet and records a live provider transaction",
    };
  }, [currency, method, recipient, validAmount]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validAmount) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (method === "SABAHUB" && !recipient.trim()) {
      toast.error("Recipient is required for a SabaHub wallet transfer.");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      if (method === "SABAHUB") {
        const tx = await sendMoney({
          recipient: recipient.trim(),
          amount: validAmount,
          method: "SABAHUB",
          description: description.trim() || undefined,
          currency,
        });

        setResult({
          headline: tx.status === "PENDING" ? "Transfer queued for review" : "Transfer completed",
          body:
            tx.status === "PENDING"
              ? "The transfer is waiting for admin approval before funds move."
              : "Funds moved through the live wallet ledger.",
          amount: validAmount,
          recipient: recipient.trim(),
          reference: tx.reference,
          provider: "SabaHub",
        });
        return;
      }

      const idempotencyKey = `wallet-funding-${method.toLowerCase()}-${Date.now()}`;
      const initResult =
        method === "STRIPE"
          ? await initStripe({ amount: validAmount, currency }, idempotencyKey)
          : await initChapa({ amount: validAmount, currency }, idempotencyKey);

      if (!initResult.checkoutUrl) {
        throw new Error(`Unable to open ${METHOD_COPY[method].label} checkout.`);
      }

      const popup = openHostedPaymentPopup(initResult.checkoutUrl, method.toLowerCase() as "stripe" | "chapa");
      const completion = await waitForHostedPaymentResult(
        popup,
        method.toLowerCase() as "stripe" | "chapa",
      );

      await fetchTransactions();

      if (recipient.trim()) {
        try {
          const tx = await sendMoney({
            recipient: recipient.trim(),
            amount: validAmount,
            method: "SABAHUB",
            description: description.trim() || `${METHOD_COPY[method].label} funded transfer`,
            currency,
          });

          setResult({
            headline: "Funding and transfer completed",
            body: `${METHOD_COPY[method].label} funded your wallet, then SabaHub moved the funds to the recipient.`,
            amount: validAmount,
            recipient: recipient.trim(),
            reference: tx.reference,
            provider: METHOD_COPY[method].label,
          });
          return;
        } catch (error) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : "The wallet funding succeeded, but the internal transfer failed.";

          setResult({
            headline: "Wallet funded",
            body: `${METHOD_COPY[method].label} funding succeeded, but the recipient transfer still needs to be retried from your wallet balance.`,
            amount: validAmount,
            recipient: recipient.trim(),
            reference: completion.providerRef || initResult.providerRef,
            provider: METHOD_COPY[method].label,
          });
          toast.error(message);
          return;
        }
      }

      setResult({
        headline: "Wallet funded",
        body: `${METHOD_COPY[method].label} completed successfully and credited your wallet.`,
        amount: validAmount,
        reference: completion.providerRef || initResult.providerRef,
        provider: METHOD_COPY[method].label,
      });
      toast.success("Wallet funded successfully.");
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Payment flow failed. Please try again.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="mb-2">Send Or Fund</h1>
        <p className="text-muted-foreground">
          Use SabaHub for direct wallet transfers, or launch Stripe/Chapa popups to fund your wallet and optionally auto-send.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            {result ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="mb-2">{result.headline}</h3>
                <p className="mb-6 max-w-xl text-muted-foreground">{result.body}</p>

                <div className="w-full max-w-xl space-y-2 rounded-xl bg-muted p-4 text-left">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">{formatCurrency(result.amount, currency)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-semibold">{result.provider ?? "SabaHub"}</span>
                  </div>
                  {result.recipient ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Recipient</span>
                      <span className="font-semibold">{result.recipient}</span>
                    </div>
                  ) : null}
                  {result.reference ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-mono text-sm font-semibold">{result.reference}</span>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setRecipient("");
                    setAmount("");
                    setDescription("");
                  }}
                  className="mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Start another payment
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    Send and funding happen in the selected wallet currency only.
                  </p>
                </div>

                <div>
                  <label className="mb-3 block">Funding Or Transfer Rail</label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {(Object.keys(METHOD_COPY) as SendMethod[]).map((option) => {
                      const meta = METHOD_COPY[option];
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setMethod(option)}
                          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all ${
                            method === option
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.tone}`}>
                            {meta.icon}
                          </div>
                          <div>
                            <div className="font-medium">{meta.label}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{meta.hint}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block">
                    {method === "SABAHUB"
                      ? "Recipient Wallet ID Or Email"
                      : "Recipient Wallet ID Or Email (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder={
                      method === "SABAHUB"
                        ? "recipient@sabahub.com"
                        : "Leave blank to fund your wallet only"
                    }
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    required={method === "SABAHUB"}
                  />
                  {method !== "SABAHUB" ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      If you enter a recipient, the app will fund your wallet in the popup and then execute a live SabaHub transfer after settlement.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block">Amount ({currency})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <div className="mt-2 text-sm text-muted-foreground">
                    Available balance: {formatCurrency(balance?.available ?? 0, currency)}
                  </div>
                </div>

                {validAmount > 0 && convertedAmount > 0 ? (
                  <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Live conversion preview</span>
                      <span className="font-semibold">
                        {formatCurrency(validAmount, currency)} = {formatCurrency(convertedAmount, alternateCurrency)}
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      The transfer itself stays in {currency}. This preview helps you compare the other supported wallet currency.
                    </p>
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block">Note</label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add internal transfer context or provider memo"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>{METHOD_COPY[method].processing}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>
                        {method === "SABAHUB"
                          ? "Send Live Wallet Transfer"
                          : `Open ${METHOD_COPY[method].label} Popup`}
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4">Execution Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{summary.primary}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3">
                <span className="font-medium">Flow</span>
                <span className="text-right text-sm text-muted-foreground">{summary.secondary}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 p-6 text-white">
            <h3 className="mb-4">Live Rail Notes</h3>
            <div className="space-y-3 text-sm text-white/85">
              <p>{METHOD_COPY[method].hint}</p>
              <div className="border-t border-white/15 pt-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-white/65">Current rail</span>
                  <span className="font-medium">{METHOD_COPY[method].label}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/65">Wallet currency</span>
                  <span className="font-medium">{currency}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            Hosted checkout completion is verified server-side before the wallet is credited.
          </div>
        </div>
      </div>
    </div>
  );
}
