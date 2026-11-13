/**
 * Client-safe helpers for the custom-order flow. No server imports: this module is
 * shared by the storefront, staff and admin client components.
 */

import type { BouquetSnapshot } from './api/client';

export type CustomStatusTone = 'waiting' | 'active' | 'done' | 'stopped';

export function bouquetSummary(bouquet: BouquetSnapshot) {
  return [
    ...bouquet.lines.map(
      ({ name, color, quantity }) => `${name}${color ? ` (${color})` : ''} × ${quantity}`,
    ),
    bouquet.wrapName,
  ].join(' · ');
}

export const CUSTOM_STEPS = [
  'Gửi yêu cầu',
  'Tiệm báo giá',
  'Bạn duyệt',
  'Tạo đơn & cọc',
  'Đang làm',
  'Giao & hoàn tất',
] as const;

const LABELS: Record<string, string> = {
  requested: 'Chờ tiệm báo giá',
  quoted: 'Chờ bạn duyệt báo giá',
  approved: 'Đã duyệt – chờ tạo đơn',
  checkedout: 'Đã tạo đơn – chờ cọc / chờ làm',
  production: 'Tiệm đang làm',
  completed: 'Đã hoàn tất',
  cancelled: 'Đã hủy',
  expired: 'Đơn hết hạn thanh toán',
};

const STEP_INDEX: Record<string, number> = {
  requested: 0,
  quoted: 1,
  approved: 2,
  checkedout: 3,
  production: 4,
  completed: CUSTOM_STEPS.length,
};

const key = (status?: string | null) => (status ?? '').replace(/[\s_-]/g, '').toLowerCase();

/** Vietnamese label for a BE request/quote status. Unknown values fall back to the raw value. */
export function customStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return LABELS[key(status)] ?? status;
}

export function customStatusTone(status?: string | null): CustomStatusTone {
  switch (key(status)) {
    case 'production':
      return 'active';
    case 'completed':
      return 'done';
    case 'cancelled':
    case 'expired':
      return 'stopped';
    default:
      return 'waiting';
  }
}

/** Zero-based index into CUSTOM_STEPS, or -1 when the request is stopped/unknown. */
export function customStepIndex(status?: string | null): number {
  return STEP_INDEX[key(status)] ?? -1;
}

/** Returns the URL only when it parses as an absolute http/https URL. */
export function safeHttpUrl(url?: string | null): string | undefined {
  const value = url?.trim();
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
