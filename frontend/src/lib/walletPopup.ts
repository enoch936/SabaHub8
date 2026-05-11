"use client";

export const WALLET_PROVIDER_MESSAGE_TYPE = "wallet-provider-complete";

export type WalletHostedProvider = "stripe" | "chapa";

export type WalletProviderMessage = {
  type: typeof WALLET_PROVIDER_MESSAGE_TYPE;
  provider: WalletHostedProvider;
  ok: boolean;
  transactionId?: string;
  providerRef?: string;
  status?: string;
  error?: string;
};

export function openHostedPaymentPopup(url: string, provider: WalletHostedProvider) {
  const width = 520;
  const height = 760;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
    "popup=yes",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  const popup = window.open(url, `sabahub-${provider}-checkout`, features);
  if (!popup) {
    throw new Error("Popup was blocked. Please allow popups and try again.");
  }
  popup.focus();
  return popup;
}

export function waitForHostedPaymentResult(
  popup: Window,
  provider: WalletHostedProvider,
  timeoutMs = 4 * 60 * 1000,
) {
  return new Promise<WalletProviderMessage>((resolve, reject) => {
    let settled = false;
    let closePoll: number | null = null;
    let timeout: number | null = null;

    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", onMessage);
      if (closePoll !== null) {
        window.clearInterval(closePoll);
      }
      if (timeout !== null) {
        window.clearTimeout(timeout);
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = event.data as WalletProviderMessage | undefined;
      if (!data || data.type !== WALLET_PROVIDER_MESSAGE_TYPE || data.provider !== provider) {
        return;
      }

      cleanup();
      if (!data.ok) {
        reject(new Error(data.error || "Hosted payment failed"));
        return;
      }
      resolve(data);
    };

    window.addEventListener("message", onMessage);

    closePoll = window.setInterval(() => {
      if (!settled && popup.closed) {
        cleanup();
        reject(new Error("Payment popup was closed before the flow finished."));
      }
    }, 400);

    timeout = window.setTimeout(() => {
      if (settled) return;
      cleanup();
      try {
        popup.close();
      } catch {}
      reject(new Error("Payment confirmation timed out. Check your transaction history and try again."));
    }, timeoutMs);
  });
}
