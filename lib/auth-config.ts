export const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-key-min-32-chars-long";

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET environment variable is required in production");
    }
    console.warn("⚠️  JWT_SECRET not set. Using default (NOT SECURE for production)");
}

export const ENCODED_SECRET = new TextEncoder().encode(JWT_SECRET);
