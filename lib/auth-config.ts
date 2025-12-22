export const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-key-min-32-chars-long";

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
        console.error("❌ CRITICAL: JWT_SECRET is missing in production! Using fallback insecure secret. Please set this variable in Render.");
    } else {
        console.warn("⚠️  JWT_SECRET not set. Using default.");
    }
}

export const ENCODED_SECRET = new TextEncoder().encode(JWT_SECRET);
