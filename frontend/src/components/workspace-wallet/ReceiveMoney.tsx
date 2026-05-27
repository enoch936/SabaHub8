"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, QrCode, RefreshCcw, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { getWalletCurrencyLabel } from "@/lib/walletCurrencies";
import { useWalletStore } from "@/lib/walletStore";
import { formatCurrency } from "@/lib/walletMetrics";

function getReceiveAlias(walletUserId: string | null) {
  if (!walletUserId) return "wallet@sabahub";
  const normalized = walletUserId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `${normalized || "wallet"}@sabahub`;
}

export function ReceiveMoney() {
  const walletUserId = useWalletStore((state) => state.walletUserId);
  const balance = useWalletStore((state) => state.balance);
  const supportedCurrencies = useWalletStore((state) => state.supportedCurrencies);
  const fetchBalance = useWalletStore((state) => state.fetchBalance);
  const [copied, setCopied] = useState<"alias" | "id" | null>(null);

  const receiveAlias = useMemo(() => getReceiveAlias(walletUserId), [walletUserId]);

  const copyText = async (value: string, field: "alias" | "id") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied((current) => (current === field ? null : current)), 1800);
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/pay/${receiveAlias}`;
    const shareData = {
      title: "Pay via SabaHub",
      text: `Pay me on SabaHub using my handle: ${receiveAlias}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Sharing failed");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Payment link copied to clipboard");
      } catch {
        toast.error("Unable to copy link");
      }
    }
  };

  const handleDownload = () => {
    const canvas = document.getElementById("wallet-qr-canvas") as HTMLCanvasElement;
    if (!canvas) {
      toast.error("QR component not found");
      return;
    }

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `sabahub-qr-${receiveAlias}.png`;
    link.href = url;
    link.click();
    toast.success("QR code downloaded");
  };

  const handleRefresh = async () => {
    await fetchBalance();
    toast.success("Wallet details refreshed");
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2">Receive Money</h1>
          <p className="text-muted-foreground">
            Share your wallet handle or QR card to collect payments quickly.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-black/10" />

            <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs uppercase tracking-wide">
                  <QrCode className="h-3.5 w-3.5" />
                  Wallet Paycard
                </div>

                <div>
                  <p className="text-sm text-white/75">Primary Handle</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-xl font-semibold">{receiveAlias}</p>
                    <button
                      onClick={() => copyText(receiveAlias, "alias")}
                      className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-1.5 text-xs transition-colors hover:bg-white/25"
                    >
                      {copied === "alias" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === "alias" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-white/75">Wallet ID</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="font-medium">{walletUserId ?? "Unavailable until wallet sync"}</p>
                    {walletUserId ? (
                      <button
                        onClick={() => copyText(walletUserId, "id")}
                        className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-1.5 text-xs transition-colors hover:bg-white/25"
                      >
                        {copied === "id" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === "id" ? "Copied" : "Copy"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mx-auto flex w-full max-w-[180px] flex-col items-center rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
                <div className="flex aspect-square w-full items-center justify-center bg-white p-1">
                  <QRCodeCanvas 
                    id="wallet-qr-canvas"
                    value={receiveAlias} 
                    size={240}
                    level="H"
                    includeMargin={false}
                    className="h-full w-full"
                  />
                </div>
                <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Scan to pay {receiveAlias}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4">Wallet Snapshot</h3>
            <div className="space-y-4">
              {supportedCurrencies.map((supportedCurrency) => {
                const currencyBalance = balance?.byCurrency[supportedCurrency];
                return (
                  <div key={supportedCurrency} className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="font-medium">{getWalletCurrencyLabel(supportedCurrency)}</span>
                      <span className="text-xs text-muted-foreground">{supportedCurrency}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-semibold">
                          {formatCurrency(currencyBalance?.availableBalance ?? 0, supportedCurrency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-semibold">
                          {formatCurrency(currencyBalance?.pendingPayouts ?? 0, supportedCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4">Share Options</h3>
            <div className="space-y-3">
              <button
                onClick={() => copyText(receiveAlias, "alias")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 transition-colors hover:bg-muted"
              >
                <Copy className="h-4 w-4" />
                <span>Copy payment handle</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 transition-colors hover:bg-muted"
              >
                <Share2 className="h-4 w-4" />
                <span>Share link</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                <span>Download QR card</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            Ask senders to double-check your handle and choose the exact ETB or USD wallet before confirming payment.
          </div>
        </div>
      </div>
    </div>
  );
}
