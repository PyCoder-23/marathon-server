/**
 * Timezone utilities for IST (Indian Standard Time) operations
 * IST is UTC+5:30
 */

/**
 * Get current date/time in IST
 */
export function getISTDate(date: Date = new Date()): Date {
    // Convert to IST by adding 5 hours and 30 minutes
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    return new Date(utc + istOffset);
}

/**
 * Get start of today at 12:00 AM IST
 */
export function getISTDayStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setHours(0, 0, 0, 0);
    return istDate;
}

/**
 * Get end of today at 11:59:59.999 PM IST
 */
export function getISTDayEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setHours(23, 59, 59, 999);
    return istDate;
}

/**
 * Get start of current week (Monday 12:00 AM IST)
 */
export function getISTWeekStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    const day = istDate.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday (0) or other days
    istDate.setDate(istDate.getDate() + diff);
    istDate.setHours(0, 0, 0, 0);
    return istDate;
}

/**
 * Get end of current week (Sunday 11:59:59.999 PM IST)
 */
export function getISTWeekEnd(date: Date = new Date()): Date {
    const weekStart = getISTWeekStart(date);
    weekStart.setDate(weekStart.getDate() + 6);
    weekStart.setHours(23, 59, 59, 999);
    return weekStart;
}

/**
 * Get start of current month (1st day 12:00 AM IST)
 */
export function getISTMonthStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setDate(1);
    istDate.setHours(0, 0, 0, 0);
    return istDate;
}

/**
 * Get end of current month (last day 11:59:59.999 PM IST)
 */
export function getISTMonthEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setMonth(istDate.getMonth() + 1);
    istDate.setDate(0); // Last day of previous month
    istDate.setHours(23, 59, 59, 999);
    return istDate;
}

/**
 * Get the previous month start (for archiving winners)
 */
export function getISTPreviousMonthStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setMonth(istDate.getMonth() - 1);
    istDate.setDate(1);
    istDate.setHours(0, 0, 0, 0);
    return istDate;
}

/**
 * Get the previous month end
 */
export function getISTPreviousMonthEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setDate(0); // Last day of previous month
    istDate.setHours(23, 59, 59, 999);
    return istDate;
}

/**
 * Format month for storage (YYYY-MM)
 */
export function formatMonthKey(date: Date = new Date()): string {
    const istDate = getISTDate(date);
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Check if a date is within the current IST day
 */
export function isToday(date: Date): boolean {
    const dayStart = getISTDayStart();
    const dayEnd = getISTDayEnd();
    return date >= dayStart && date <= dayEnd;
}

/**
 * Check if a date is within the current IST week
 */
export function isThisWeek(date: Date): boolean {
    const weekStart = getISTWeekStart();
    const weekEnd = getISTWeekEnd();
    return date >= weekStart && date <= weekEnd;
}

/**
 * Check if a date is within the current IST month
 */
export function isThisMonth(date: Date): boolean {
    const monthStart = getISTMonthStart();
    const monthEnd = getISTMonthEnd();
    return date >= monthStart && date <= monthEnd;
}
