"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-context";

import { Suspense } from "react";

function VerifyResetCodeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const { toast } = useToast();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await api.post("/api/auth/verify-reset-code", { email, code });
            toast({
                title: "Code Verified",
                variant: "success"
            });
            router.push(`/reset-password-final?token=${data.token}`);
        } catch (error: any) {
            toast({
                title: "Verification Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black p-4">
            <Card className="w-full max-w-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Enter Code</CardTitle>
                    <CardDescription className="text-center">
                        Enter the 6-digit code sent to {email}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            className="text-center text-2xl tracking-[1em] font-mono h-14"
                            maxLength={6}
                            required
                        />
                        <Button className="w-full" type="submit" disabled={loading || code.length !== 6}>
                            {loading ? "Verifying..." : "Verify Code"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyResetCodePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyResetCodeContent />
        </Suspense>
    );
}
