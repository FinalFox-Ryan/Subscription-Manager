import { addMonths, startOfMonth, subMonths, differenceInCalendarMonths, format, getDaysInMonth, differenceInDays } from 'date-fns';

export const getTimelineRange = (customStart?: Date, customEnd?: Date): { start: Date; end: Date; months: Date[] } => {
  const now = new Date();
  // Default: -1 month to +13 months if no custom dates provided
  const start = customStart ? startOfMonth(customStart) : startOfMonth(subMonths(now, 1));
  const end = customEnd ? startOfMonth(customEnd) : startOfMonth(addMonths(now, 13));
  
  const months: Date[] = [];
  let current = start;
  while (current <= end) {
    months.push(current);
    current = addMonths(current, 1);
  }

  return { start, end, months };
};

// Calculate the left position percentage for a given date relative to the timeline start
export const getPositionPercentage = (date: Date, timelineStart: Date, totalDays: number): number => {
  if (date < timelineStart) return 0;
  const diffDays = differenceInDays(date, timelineStart);
  return (diffDays / totalDays) * 100;
};

// Calculate width percentage based on duration
export const getWidthPercentage = (start: Date, end: Date | undefined, timelineStart: Date, timelineEnd: Date, totalDays: number): number => {
  // Clamp start date to timeline view
  const effectiveStart = start < timelineStart ? timelineStart : start;
  
  // Clamp end date (if infinite, cap at timeline end)
  const effectiveEnd = !end || end > timelineEnd ? timelineEnd : end;
  
  if (effectiveEnd < effectiveStart) return 0;

  const durationDays = differenceInDays(effectiveEnd, effectiveStart);
  // Add 1 day so single day events have width
  return ((durationDays + 1) / totalDays) * 100;
};

export const formatMoney = (amount: number, currency: string = 'KRW') => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency }).format(amount);
};