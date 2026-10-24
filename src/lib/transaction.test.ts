import { describe, expect, it } from 'vitest';
import { isOpenFutureSession, payloadFingerprint, remainingSeats } from './transaction';
const session = {
  id: 'session',
  workshopId: 'workshop',
  sessionDate: '2027-01-30T00:00:00',
  startTime: '14:00:00',
  endTime: '16:30:00',
  location: 'Test studio',
  capacity: 8,
  bookedSlots: 2,
  sessionStatus: 'Open',
};
describe('giao dịch', () => {
  it('đọc được sessionDate ISO từ ASP.NET, không nối hai ký tự T', () => {
    expect(isOpenFutureSession(session, new Date('2026-10-23T00:00:00Z'))).toBe(true);
  });
  it('không coi ca quá hạn, đóng hoặc hết chỗ là khả dụng', () => {
    expect(isOpenFutureSession(session, new Date('2028-01-01'))).toBe(false);
    expect(
      isOpenFutureSession({ ...session, sessionStatus: 'Closed' }, new Date('2026-10-23')),
    ).toBe(false);
    expect(isOpenFutureSession({ ...session, bookedSlots: 8 }, new Date('2026-10-23'))).toBe(false);
    expect(remainingSeats({ ...session, bookedSlots: 9 })).toBe(0);
  });
  it('fingerprint ổn định khi thứ tự thuộc tính thay đổi', () => {
    expect(payloadFingerprint({ items: [{ id: 'a', quantity: 1 }], address: 'A' })).toBe(
      payloadFingerprint({ address: 'A', items: [{ quantity: 1, id: 'a' }] }),
    );
  });
  it('fingerprint đổi nếu địa chỉ hoặc số lượng thay đổi', () => {
    expect(payloadFingerprint({ address: 'A', quantity: 1 })).not.toBe(
      payloadFingerprint({ address: 'B', quantity: 1 }),
    );
    expect(payloadFingerprint({ address: 'A', quantity: 1 })).not.toBe(
      payloadFingerprint({ address: 'A', quantity: 2 }),
    );
  });
});
