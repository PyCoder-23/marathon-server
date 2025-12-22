// Simple in-memory rate limiter
// For production, use Redis or a proper rate limiting service

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export function checkRateLimit(
    identifier: string,
    maxAttempts: number = 3,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
        // First attempt or window expired
        const resetTime = now + windowMs;
        rateLimitStore.set(identifier, { count: 1, resetTime });
        return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime };
    }

    if (entry.count >= maxAttempts) {
        // Rate limit exceeded
        return { allowed: false, remainingAttempts: 0, resetTime: entry.resetTime };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(identifier, entry);
    return { allowed: true, remainingAttempts: maxAttempts - entry.count, resetTime: entry.resetTime };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0) {
        return { valid: false, error: 'Email cannot be empty' };
    }

    if (trimmedEmail.length > 254) {
        return { valid: false, error: 'Email is too long' };
    }

    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmedEmail)) {
        return { valid: false, error: 'Invalid email format' };
    }

    // Additional checks
    const [localPart, domain] = trimmedEmail.split('@');

    if (localPart.length > 64) {
        return { valid: false, error: 'Email local part is too long' };
    }

    if (domain.length > 253) {
        return { valid: false, error: 'Email domain is too long' };
    }

    // Check for common disposable email domains (optional)
    const disposableDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com'];
    if (disposableDomains.some(d => domain.toLowerCase().includes(d))) {
        return { valid: false, error: 'Disposable email addresses are not allowed' };
    }

    return { valid: true };
}
