import { initChapa } from "./api";

export interface ChapaPaymentPayload {
  amount: number;
  currency: string;
  email: string;
  firstName: string;
  txRef: string;
}

export async function initiateChapaPayment(
  payload: ChapaPaymentPayload
): Promise<{ checkoutUrl: string; txRef: string }> {
  const data = await initChapa(
    {
      amount: payload.amount,
      currency: payload.currency,
    },
    payload.txRef,
  );
  return {
    checkoutUrl: data.checkoutUrl ?? "",
    txRef: data.providerRef ?? data.transactionId,
  };
}
