import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { ENCODED_SECRET } from "./auth-config";

export async function hashPassword(password: string): Promise<string> {
    return await hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await compare(password, hash);
}

export async function signToken(payload: any, expiresIn: string = "7d"): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(ENCODED_SECRET);
}

export async function signResetToken(payload: any): Promise<string> {
    return signToken(payload, "15m");
}

export async function verifyToken(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, ENCODED_SECRET);
        return payload;
    } catch (err) {
        return null;
    }
}
