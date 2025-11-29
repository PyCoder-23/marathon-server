import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { ENCODED_SECRET } from "@/lib/auth-config";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/missions", "/squads", "/leaderboard"];

// Routes that require admin access
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if route needs protection
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));

    if (!isProtected && !isAdmin) {
        return NextResponse.next();
    }

    // Get token from cookie
    const token = request.cookies.get("token")?.value;

    if (!token) {
        // Redirect to login if no token
        const url = new URL("/login", request.url);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    try {
        // Verify token
        const { payload } = await jwtVerify(token, ENCODED_SECRET);

        // Check admin access
        if (isAdmin && !payload.isAdmin) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware token verification failed:", error);
        // Invalid token, redirect to login
        const url = new URL("/login", request.url);
        url.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(url);
        response.cookies.delete("token");
        return response;
    }
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/missions/:path*",
        "/squads/:path*",
        "/leaderboard/:path*",
        "/admin/:path*",
    ],
};
