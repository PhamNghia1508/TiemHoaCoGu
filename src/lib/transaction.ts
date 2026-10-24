import type { CheckoutRequest, CustomQuote, Session } from '@/lib/api/client';

export type ShippingQuote = {
  id: string;
  amount?: number;
  shippingFee?: number;
  expiresAt?: string;
};

export type CustomQuoteState = CustomQuote & {
  revisions?: CustomQuote['revisions'];
};

export function payloadFingerprint(value: unknown): string {
  return JSON.stringify(value, (_, item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return Object.keys(item)
        .sort()
        .reduce<Record<string, unknown>>((out, key) => {
          out[key] = item[key];
          return out;
        }, {});
    }
    return item;
  });
}

export function remainingSeats(session: Session): number {
  return Math.max(0, session.capacity - session.bookedSlots);
}

export function isOpenFutureSession(session: Session, now = new Date()): boolean {
  const date = new Date(`${session.sessionDate.slice(0, 10)}T${session.startTime}`);
  return (
    session.sessionStatus.toLowerCase() === 'open' &&
    date.getTime() > now.getTime() &&
    remainingSeats(session) > 0
  );
}

export type CheckoutPayload = CheckoutRequest & { idempotencyKey: string };
