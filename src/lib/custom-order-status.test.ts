import { describe, expect, it } from 'vitest';
import {
  CUSTOM_STEPS,
  customStatusLabel,
  customStatusTone,
  customStepIndex,
  safeHttpUrl,
} from './custom-order-status';

describe('custom order status helper', () => {
  it('maps every BE status to its Vietnamese label', () => {
    expect(customStatusLabel('Requested')).toBe('Chờ tiệm báo giá');
    expect(customStatusLabel('Quoted')).toBe('Chờ bạn duyệt báo giá');
    expect(customStatusLabel('Approved')).toBe('Đã duyệt – chờ tạo đơn');
    expect(customStatusLabel('CheckedOut')).toBe('Đã tạo đơn – chờ cọc / chờ làm');
    expect(customStatusLabel('Production')).toBe('Tiệm đang làm');
    expect(customStatusLabel('Completed')).toBe('Đã hoàn tất');
    expect(customStatusLabel('Cancelled')).toBe('Đã hủy');
    expect(customStatusLabel('Expired')).toBe('Đơn hết hạn thanh toán');
  });

  it('falls back to the raw value for unknown or missing statuses', () => {
    expect(customStatusLabel('SomethingElse')).toBe('SomethingElse');
    expect(customStatusLabel('')).toBe('—');
    expect(customStatusLabel(undefined)).toBe('—');
  });

  it('groups statuses into four tones', () => {
    expect(customStatusTone('Requested')).toBe('waiting');
    expect(customStatusTone('Quoted')).toBe('waiting');
    expect(customStatusTone('Approved')).toBe('waiting');
    expect(customStatusTone('CheckedOut')).toBe('waiting');
    expect(customStatusTone('Production')).toBe('active');
    expect(customStatusTone('Completed')).toBe('done');
    expect(customStatusTone('Cancelled')).toBe('stopped');
    expect(customStatusTone('Expired')).toBe('stopped');
  });

  it('maps statuses onto the six progress steps', () => {
    expect(CUSTOM_STEPS).toHaveLength(6);
    expect(customStepIndex('Requested')).toBe(0);
    expect(customStepIndex('Quoted')).toBe(1);
    expect(customStepIndex('Approved')).toBe(2);
    expect(customStepIndex('CheckedOut')).toBe(3);
    expect(customStepIndex('Production')).toBe(4);
    expect(customStepIndex('Completed')).toBe(CUSTOM_STEPS.length);
    expect(customStepIndex('Cancelled')).toBe(-1);
    expect(customStepIndex('Expired')).toBe(-1);
    expect(customStepIndex('unknown')).toBe(-1);
  });

  it('accepts only absolute http and https reference URLs', () => {
    expect(safeHttpUrl('https://example.com/mau-hoa.jpg')).toBe('https://example.com/mau-hoa.jpg');
    expect(safeHttpUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
    expect(safeHttpUrl('  https://example.com/a.png  ')).toBe('https://example.com/a.png');
    expect(safeHttpUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeHttpUrl('data:text/html,hi')).toBeUndefined();
    expect(safeHttpUrl('ftp://example.com/a.png')).toBeUndefined();
    expect(safeHttpUrl('/images/local.webp')).toBeUndefined();
    expect(safeHttpUrl('example.com/a.png')).toBeUndefined();
    expect(safeHttpUrl('')).toBeUndefined();
    expect(safeHttpUrl(undefined)).toBeUndefined();
  });
});
