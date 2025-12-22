/**
 * Timezone utilities for IST (Indian Standard Time) operations
 * IST is UTC+5:30
 * 
 * STRATEGY:
 * We use a "Fake UTC" approach. We shift the underlying timestamp by +5.5 hours.
 * The resulting Date object, when inspecting its UTC components (.getUTCHours),
 * actually reflects the IST time.
 * 
 * Example: Real Time 12:00 UTC (17:30 IST).
 * Shifted: 17:30 UTC.
 * .getUTCHours() -> 17. (Matches IST hour).
 * 
 * We perform manipuations (setUTCHours(0)) on this shifted date.
 * Then we shift back (-5.5h) to get the real UTC timestamp for the DB.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Returns a Date object where the UTC components match IST time.
 * E.g., if it is 12:30 UTC (6:00 PM IST), this returns a Date that looks like 6:00 PM UTC.
 * This is "IST Time stored in UTC container".
 */
export function getISTDate(date: Date = new Date()): Date {
    const utcTime = date.getTime();
    return new Date(utcTime + IST_OFFSET_MS);
}

/**
 * Converts an "IST Context" date (shifted UTC) back to real UTC timestamp for database storage.
 */
export function toDBTime(istDate: Date): Date {
    return new Date(istDate.getTime() - IST_OFFSET_MS);
}

/**
 * Get start of today at 12:00 AM IST (Returned as Real UTC timestamp for DB)
 */
export function getISTDayStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setUTCHours(0, 0, 0, 0);
    return toDBTime(istDate);
}

/**
 * Get end of today at 11:59:59.999 PM IST (Returned as Real UTC timestamp for DB)
 */
export function getISTDayEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setUTCHours(23, 59, 59, 999);
    return toDBTime(istDate);
}

/**
 * Get start of current week (Monday 12:00 AM IST) (Returned as Real UTC timestamp for DB)
 */
export function getISTWeekStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    const day = istDate.getUTCDay(); // 0 (Sun) to 6 (Sat)
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday

    istDate.setUTCDate(istDate.getUTCDate() + diff);
    istDate.setUTCHours(0, 0, 0, 0);
    return toDBTime(istDate);
}

/**
 * Get end of current week (Sunday 11:59:59.999 PM IST) (Returned as Real UTC timestamp for DB)
 */
export function getISTWeekEnd(date: Date = new Date()): Date {
    // We get Monday Start shifted
    const istDate = getISTDate(date);
    const day = istDate.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;

    istDate.setUTCDate(istDate.getUTCDate() + diff + 6); // Monday + 6 = Sunday
    istDate.setUTCHours(23, 59, 59, 999);

    return toDBTime(istDate);
}

/**
 * Get start of current month (1st day 12:00 AM IST) (Returned as Real UTC timestamp for DB)
 */
export function getISTMonthStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setUTCDate(1);
    istDate.setUTCHours(0, 0, 0, 0);
    return toDBTime(istDate);
}

/**
 * Get end of current month (last day 11:59:59.999 PM IST) (Returned as Real UTC timestamp for DB)
 */
export function getISTMonthEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setUTCMonth(istDate.getUTCMonth() + 1);
    istDate.setUTCDate(0); // Last day of previous (current) month
    istDate.setUTCHours(23, 59, 59, 999);
    return toDBTime(istDate);
}

/**
 * Get the previous month start (Returned as Real UTC timestamp for DB)
 */
export function getISTPreviousMonthStart(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setUTCMonth(istDate.getUTCMonth() - 1);
    istDate.setUTCDate(1);
    istDate.setUTCHours(0, 0, 0, 0);
    return toDBTime(istDate);
}

/**
 * Get the previous month end (Returned as Real UTC timestamp for DB)
 */
export function getISTPreviousMonthEnd(date: Date = new Date()): Date {
    const istDate = getISTDate(date);
    istDate.setUTCDate(0); // 0th of current month = End of prev month
    istDate.setUTCHours(23, 59, 59, 999);
    return toDBTime(istDate);
}

/**
 * Format month for storage (YYYY-MM)
 */
export function formatMonthKey(date: Date = new Date()): string {
    const istDate = getISTDate(date);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Format IST Date YYYY-MM-DD
 */
export function formatISTDate(date: Date = new Date()): string {
    const istDate = getISTDate(date);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
