import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// Validate JWT_SECRET exists in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET environment variable is required in production");
    }
    console.warn("⚠️  JWT_SECRET not set. Using default (NOT SECURE for production)");
}

const ENCODED_SECRET = new TextEncoder().encode(
    JWT_SECRET || "dev-only-secret-key-min-32-chars-long"
);

export async function hashPassword(password: string): Promise<string> {
    return await hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await compare(password, hash);
}

export async function signToken(payload: any): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(ENCODED_SECRET);
}

export async function verifyToken(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, ENCODED_SECRET);
        return payload;
    } catch (err) {
        return null;
    }
}
