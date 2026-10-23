"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { finalizeChapaFunding, finalizeStripeFunding } from "@/lib/api";
import {
  WALLET_PROVIDER_MESSAGE_TYPE,
  type WalletHostedProvider,
  type WalletProviderMessage,
} from "@/lib/walletPopup";

function buildMessage(payload: WalletProviderMessage) {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
    }
  } catch {}
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Finalizing your payment and syncing your wallet...");

  const provider = useMemo(() => {
    const raw = searchParams.get("provider") || searchParams.get("amp;provider");
    return raw === "stripe" || raw === "chapa" ? (raw as WalletHostedProvider) : null;
  }, [searchParams]);

  // Robustly extract IDs, handling potential &amp; encoding
  const transactionId = searchParams.get("transactionId") || searchParams.get("amp;transactionId") || undefined;
  const providerRef = searchParams.get("providerRef") || searchParams.get("amp;providerRef") || searchParams.get("session_id") || searchParams.get("amp;session_id") || undefined;

  useEffect(() => {
    let cancelled = false;

    async function finalize() {
      if (!provider) {
        setStatus("error");
        setMessage("Unknown payment provider.");
        return;
      }

      if (!transactionId && !providerRef) {
        setStatus("error");
        setMessage("Missing transaction identifiers.");
        return;
      }

      try {
        const result =
          provider === "stripe"
            ? await finalizeStripeFunding({ transactionId, providerRef })
            : await finalizeChapaFunding({ transactionId, providerRef });

        if (cancelled) return;

        setStatus("success");
        setMessage("Payment confirmed. Your wallet has been updated.");
        buildMessage({
          type: WALLET_PROVIDER_MESSAGE_TYPE,
          provider,
          ok: true,
          transactionId: result.transactionId,
          providerRef: result.providerRef,
          status: result.status,
        });

        window.setTimeout(() => {
          try {
            window.close();
          } catch {}
        }, 1500);
      } catch (error) {
        if (cancelled) return;
        const text = error instanceof Error && error.message ? error.message : "Unable to finalize payment.";
        setStatus("error");
        setMessage(text);
        buildMessage({
          type: WALLET_PROVIDER_MESSAGE_TYPE,
          provider,
          ok: false,
          transactionId,
          providerRef,
          error: text,
        });
      }
    }

    void finalize();

    return () => {
      cancelled = true;
    };
  }, [provider, providerRef, transactionId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div
          className={`mb-4 h-3 w-3 rounded-full ${
            status === "processing"
              ? "bg-amber-500 animate-pulse"
              : status === "success"
                ? "bg-emerald-500"
                : "bg-rose-500"
          }`}
        />
        <h1 className="text-2xl font-semibold text-slate-900">
          {status === "processing" ? "Finalizing payment" : status === "success" ? "Payment complete" : "Payment failed"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <button
          type="button"
          onClick={() => window.close()}
          className="mt-6 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Close window
        </button>
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <div className="mb-4 h-3 w-3 animate-pulse rounded-full bg-slate-200" />
          <h1 className="text-2xl font-semibold text-slate-900">Loading payment details...</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Please wait while we initialize the secure session.</p>
        </div>
      </main>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
