import { initStripe } from "./api";

export async function createStripePaymentIntent(
  amount: number,
  currency: string,
  metadata?: Record<string, string>
): Promise<{ clientSecret: string; intentId: string }> {
  const data = await initStripe({ amount, currency }, metadata?.idempotencyKey);
  return {
    clientSecret: data.checkoutUrl ?? "",
    intentId: data.providerRef ?? data.transactionId,
  };
}
