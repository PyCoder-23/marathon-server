"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Link2, Mail } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast-context";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/api/auth/forgot-password", { email });
            toast({
                title: "Code Sent",
                description: "If an account exists, we've sent a code to your email.",
                variant: "success",
            });
            router.push(`/verify-reset-code?email=${encodeURIComponent(email)}`);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to request password reset",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black p-4">
            <Card className="w-full max-w-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">Enter your email to receive a reset code</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Code"}
                        </Button>
                        <Link href="/login" className="text-sm text-primary hover:underline text-center w-full">
                            Back to Login
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
