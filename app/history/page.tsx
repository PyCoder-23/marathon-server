"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, AlertCircle, History, Calendar } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface HistoryItem {
    id: string;
    amount: number;
    note: string | null;
    createdAt: string;
}

export default function HistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.get("/api/users/history");
                setHistory(data.history || []);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // Group by date
    const groupedHistory = history.reduce((groups, item) => {
        const date = new Date(item.createdAt);
        const key = date.toLocaleDateString("en-US", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {} as Record<string, HistoryItem[]>);

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        <History className="w-8 h-8 text-primary" />
                        Mission Log
                    </h1>
                    <p className="text-muted">Track your daily victories and strategic setbacks.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : history.length === 0 ? (
                <Card className="border-white/10 bg-black/40">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <History className="w-12 h-12 text-muted mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">No History Yet</h3>
                        <p className="text-muted max-w-sm mb-6">
                            Complete missions to start building your legacy.
                        </p>
                        <Link href="/missions">
                            <Button className="shadow-[0_0_15px_rgba(0,255,149,0.3)]">
                                View Missions
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {Object.entries(groupedHistory).map(([date, items]) => (
                        <div key={date} className="space-y-4">
                            <div className="flex items-center gap-2 text-primary/80 font-mono text-sm uppercase tracking-wider pl-1">
                                <Calendar className="w-4 h-4" />
                                {date}
                            </div>

                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden"
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.amount >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 p-2 rounded-full ${item.amount >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {item.amount >= 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white text-lg">
                                                        {item.note || (item.amount >= 0 ? "Mission Completed" : "Mission Penalty")}
                                                    </p>
                                                    <p className="text-xs text-muted font-mono mt-1">
                                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className={`font-mono font-bold text-xl ${item.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {item.amount >= 0 ? '+' : ''}{item.amount} XP
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
