"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export default function WelcomePage() {
    const { user } = useAuth();
    const [squadName, setSquadName] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.squadId) {
            fetchSquadName(user.squadId);
        } else {
            setLoading(false);
        }
    }, [user]);

    async function fetchSquadName(squadId: string) {
        try {
            const data = await api.get(`/api/squads/${squadId}`);
            setSquadName(data.squad.name);
        } catch (error) {
            console.error("Failed to fetch squad:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
            <Card className="w-full max-w-lg border-primary/20 shadow-[0_0_30px_rgba(0,255,149,0.15)]">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl text-primary">Welcome to the Camp</CardTitle>
                    <CardDescription className="text-lg">
                        Your account has been successfully created.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-white/5 p-6 rounded-lg border border-white/10 text-center space-y-2">
                        <p className="text-muted">You have been assigned to</p>
                        {loading ? (
                            <div className="h-8 w-32 bg-white/10 animate-pulse rounded mx-auto" />
                        ) : (
                            <p className="text-2xl font-bold text-white">{squadName || "Recruit Squad"}</p>
                        )}
                        <p className="text-sm text-muted pt-2">
                            Work with your squad to dominate the leaderboard!
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold mt-0.5">1</div>
                            <div>
                                <p className="font-medium text-white">Join the Discord</p>
                                <p className="text-sm text-muted">Connect with your squad mates and get updates.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold mt-0.5">2</div>
                            <div>
                                <p className="font-medium text-white">Start a Session</p>
                                <p className="text-sm text-muted">Go to your dashboard and track your first study session.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold mt-0.5">3</div>
                            <div>
                                <p className="font-medium text-white">Complete Missions</p>
                                <p className="text-sm text-muted">Check the mission board for daily objectives.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Link href="/dashboard" className="w-full">
                        <Button className="w-full shadow-[0_0_15px_rgba(0,255,149,0.2)] text-lg h-12">
                            Enter Dashboard
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="https://discord.com/invite/N72xXtZtGS" target="_blank" className="w-full">
                        <Button variant="outline" className="w-full">
                            Join Discord Server
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
