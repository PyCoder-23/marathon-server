"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { signup } = useAuth();

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;
        const discordHandle = formData.get("discordHandle") as string;

        // Validate password confirmation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        // Validate Discord handle
        const discordRegex = /^@?[\w._]{2,32}$|^.{2,32}#\d{4}$/;
        if (discordHandle && !discordRegex.test(discordHandle)) {
            setError("Invalid Discord handle format. Use @username or User#1234");
            setIsLoading(false);
            return;
        }

        try {
            await signup(email, username, password, discordHandle || undefined);
        } catch (err: any) {
            setError(err.message || "Signup failed. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
            <Card className="w-full max-w-md border-primary/20 shadow-[0_0_20px_rgba(0,255,149,0.1)]">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center text-primary">Begin Training</CardTitle>
                    <CardDescription className="text-center">
                        Create your account to join the Marathon
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                Email
                            </label>
                            <Input id="email" name="email" type="email" placeholder="cadet@marathon.com" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">
                                Username
                            </label>
                            <Input id="username" name="username" type="text" placeholder="Callsign" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="discordHandle">
                                Discord Handle
                            </label>
                            <Input id="discordHandle" name="discordHandle" type="text" placeholder="@username" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                Password
                            </label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="confirm-password">
                                Confirm Password
                            </label>
                            <Input id="confirm-password" name="confirmPassword" type="password" required />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? "Initializing..." : "Create Account"}
                        </Button>
                        <p className="text-xs text-center text-muted">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline">
                                Login
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
