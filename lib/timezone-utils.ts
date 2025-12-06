/**
 * Timezone utilities for IST (Indian Standard Time) operations
 * IST is UTC+5:30
 */

/**
 * Helper to convert "Fake IST-as-UTC" date from getISTDate() back to Real UTC for DB Query
 * 00:00 IST = Prev Day 18:30 UTC (-5.5 hours)
 */
export function toDBTime(istDate: Date): Date {
    return new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
}

/**
 * Get current date/time in IST - Returns "Fake UTC" object where time is shifted to match IST
 * NOTE: Use this ONLY for display/logic, NOT for saving to DB unless you convert back!
 */
export function getISTDate(date: Date = new Date()): Date {
    // Convert to IST by adding 5 hours and 30 minutes
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    return new Date(utc + istOffset);
}

/**
 * Get start of today at 12:00 AM IST (Returned as Real UTC timestamp for DB)
 */
export function getISTDayStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setHours(0, 0, 0, 0);
    return toDBTime(istDate);
}

/**
 * Get end of today at 11:59:59.999 PM IST (Returned as Real UTC timestamp for DB)
 */
export function getISTDayEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setHours(23, 59, 59, 999);
    return toDBTime(istDate);
}

/**
 * Get start of current week (Monday 12:00 AM IST) (Returned as Real UTC timestamp for DB)
 */
export function getISTWeekStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    const day = istDate.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday (0) or other days
    istDate.setDate(istDate.getDate() + diff);
    istDate.setHours(0, 0, 0, 0);
    return toDBTime(istDate);
}

/**
 * Get end of current week (Sunday 11:59:59.999 PM IST) (Returned as Real UTC timestamp for DB)
 */
export function getISTWeekEnd(date: Date = new Date()): Date {
    // We can't use getISTWeekStart above directly because it returns a DB time now.
    // We need to work with the fake IST date first.
    const istDate = getISTDate(date);
    const day = istDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    // Week Start IST
    istDate.setDate(istDate.getDate() + diff);

    // Week End IST (Start + 6 days)
    istDate.setDate(istDate.getDate() + 6);
    istDate.setHours(23, 59, 59, 999);

    return toDBTime(istDate);
}

/**
 * Get start of current month (1st day 12:00 AM IST) (Returned as Real UTC timestamp for DB)
 */
export function getISTMonthStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setDate(1);
    istDate.setHours(0, 0, 0, 0);
    return toDBTime(istDate);
}

/**
 * Get end of current month (last day 11:59:59.999 PM IST) (Returned as Real UTC timestamp for DB)
 */
export function getISTMonthEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setMonth(istDate.getMonth() + 1);
    istDate.setDate(0); // Last day of previous month
    istDate.setHours(23, 59, 59, 999);
    return toDBTime(istDate);
}

/**
 * Get the previous month start (Returned as Real UTC timestamp for DB)
 */
export function getISTPreviousMonthStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setMonth(istDate.getMonth() - 1);
    istDate.setDate(1);
    istDate.setHours(0, 0, 0, 0);
    return toDBTime(istDate);
}

/**
 * Get the previous month end (Returned as Real UTC timestamp for DB)
 */
export function getISTPreviousMonthEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setDate(0); // Last day of previous month
    istDate.setHours(23, 59, 59, 999);
    return toDBTime(istDate);
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
