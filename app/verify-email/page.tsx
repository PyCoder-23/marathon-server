"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

export default function VerifyEmailPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/api/auth/verify-email", { code });
            toast({
                title: "Email Verified",
                description: "Your account is now active. Welcome aboard!",
                variant: "success"
            });
            router.push("/welcome");
        } catch (error: any) {
            toast({
                title: "Verification Failed",
                description: error.message || "Please check your code and try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Card className="w-full max-w-md border-white/10 bg-zinc-950">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-white">Verify your Email</CardTitle>
                    <CardDescription>
                        We've sent a 6-digit code to your email. Enter it below to confirm your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                className="text-center text-2xl tracking-[1em] font-mono bg-black/50 border-white/10 h-14"
                                maxLength={6}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? "Verifying..." : "Verify Email"}
                        </Button>
                        <p className="text-xs text-center text-muted">
                            Check your spam folder if you don't see it.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
