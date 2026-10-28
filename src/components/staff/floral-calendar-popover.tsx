'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

type Props = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  sessionsDates?: string[]; // ISO or YYYY-MM-DD
};

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function FloralCalendarPopover({
  selectedDate,
  onSelectDate,
  sessionsDates = [],
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate));
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep viewDate in sync when selectedDate changes externally
  useEffect(() => {
    setViewDate(new Date(selectedDate));
  }, [selectedDate]);

  // Click outside listener to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    onSelectDate(now);
    setViewDate(now);
    setIsOpen(false);
  };

  // Generate 42 days grid for calendar (6 weeks)
  const firstDayOfMonth = new Date(year, month, 1);
  let firstDayIndex = firstDayOfMonth.getDay() - 1; // 0 is Mon, 6 is Sun
  if (firstDayIndex === -1) firstDayIndex = 6; // Sunday is index 6

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Trailing days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Days of current month
  const lastDayCurrentMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDayCurrentMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Leading days of next month to complete 42 or 35 cells
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const hasSessionsOnDate = (d: Date) => {
    return sessionsDates.some((sd) => {
      const parsed = new Date(sd);
      return isSameDay(parsed, d);
    });
  };

  return (
    <div className="floral-picker-container" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`floral-picker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Mở lịch chọn ngày"
        aria-expanded={isOpen}
      >
        <CalendarIcon size={15} />
        <span>
          {new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(selectedDate)}
        </span>
      </button>

      {/* Popover Floating Window */}
      {isOpen && (
        <div className="floral-popover-card" role="dialog" aria-label="Bảng chọn lịch ngày">
          {/* Popover Header */}
          <div className="floral-popover-header">
            <button
              type="button"
              className="floral-nav-btn"
              onClick={handlePrevMonth}
              title="Tháng trước"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="floral-popover-title">
              Tháng {month + 1}, {year}
            </span>

            <button
              type="button"
              className="floral-nav-btn"
              onClick={handleNextMonth}
              title="Tháng sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="floral-popover-weekdays">
            {dayNames.map((name) => (
              <span key={name} className="floral-popover-weekday">
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="floral-popover-grid">
            {days.map(({ date, isCurrentMonth }) => {
              const selected = isSameDay(date, selectedDate);
              const today = isToday(date);
              const hasSession = hasSessionsOnDate(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  className={`floral-popover-day ${isCurrentMonth ? '' : 'outside'} ${
                    selected ? 'selected' : ''
                  } ${today ? 'today' : ''}`}
                  onClick={() => {
                    onSelectDate(date);
                    setIsOpen(false);
                  }}
                >
                  <span className="floral-day-text">{date.getDate()}</span>
                  {hasSession && <span className="floral-session-dot" />}
                </button>
              );
            })}
          </div>

          {/* Popover Footer */}
          <div className="floral-popover-footer">
            <button type="button" className="floral-action-link" onClick={handleGoToday}>
              Hôm nay
            </button>
            <button
              type="button"
              className="floral-action-link close-link"
              onClick={() => setIsOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
