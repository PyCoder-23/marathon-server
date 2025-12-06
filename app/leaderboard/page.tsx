"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
    id: string;
    username: string;
    image: string | null;
    totalXp: number;
    totalMinutes: number;
    squad: { name: string } | null;
    rank: number;
    isCurrentUser: boolean;
    equippedFrame?: string;
    equippedNameplate?: string;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("weekly");

    useEffect(() => {
        fetchLeaderboard(period);
    }, [period]);

    async function fetchLeaderboard(p: string) {
        setLoading(true);
        try {
            const data = await api.get(`/api/leaderboard?period=${p}`);
            setLeaderboard(data.leaderboard);
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setLoading(false);
        }
    }

    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Global Rankings</h1>
                <p className="text-muted">See who's leading the charge in the Marathon.</p>
            </div>

            <Tabs defaultValue="weekly" className="w-full max-w-4xl mx-auto" onValueChange={setPeriod}>
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-black/40 border border-white/10">
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="all-time">All Time</TabsTrigger>
                    </TabsList>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[40vh]">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted">Updating rankings...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Podium */}
                        {/* Podium */}
                        {topThree.length > 0 && (
                            <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 mb-12 min-h-[250px]">
                                {/* 2nd Place */}
                                {topThree[1] && (
                                    <div className="flex flex-col items-center order-2 md:order-1 w-full md:w-1/3">
                                        <div className="mb-4 text-center">
                                            <div className={`w-20 h-20 rounded-full bg-white/10 border-2 border-gray-400 flex items-center justify-center text-2xl font-bold text-gray-400 mb-2 mx-auto overflow-hidden ${topThree[1].equippedFrame || ''}`}>
                                                {topThree[1].image ? (
                                                    <img src={topThree[1].image} alt={topThree[1].username} className="w-full h-full object-cover" />
                                                ) : (
                                                    topThree[1].username.charAt(0)
                                                )}
                                            </div>
                                            <p className={`font-bold text-white truncate max-w-[150px] ${topThree[1].equippedNameplate || ''}`}>{topThree[1].username}</p>
                                            <p className="text-sm text-primary font-mono">{topThree[1].totalXp.toLocaleString()} XP</p>
                                        </div>
                                        <div className="w-full h-32 bg-gradient-to-t from-gray-900/80 to-gray-800/20 border-t-4 border-gray-400 rounded-t-lg flex flex-col items-center justify-end pb-4 relative">
                                            <Medal className="w-8 h-8 text-gray-400 mb-2" />
                                            <div className="text-4xl font-bold text-white/20">2</div>
                                        </div>
                                    </div>
                                )}

                                {/* 1st Place */}
                                {topThree[0] && (
                                    <div className="flex flex-col items-center order-1 md:order-2 w-full md:w-1/3 z-10">
                                        <div className="mb-4 text-center">
                                            <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2 animate-bounce" />
                                            <div className={`w-24 h-24 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-3xl font-bold text-yellow-500 mb-2 mx-auto shadow-[0_0_20px_rgba(234,179,8,0.3)] overflow-hidden ${topThree[0].equippedFrame || ''}`}>
                                                {topThree[0].image ? (
                                                    <img src={topThree[0].image} alt={topThree[0].username} className="w-full h-full object-cover" />
                                                ) : (
                                                    topThree[0].username.charAt(0)
                                                )}
                                            </div>
                                            <p className={`font-bold text-white text-lg truncate max-w-[150px] ${topThree[0].equippedNameplate || ''}`}>{topThree[0].username}</p>
                                            <p className="text-sm text-primary font-mono">{topThree[0].totalXp.toLocaleString()} XP</p>
                                        </div>
                                        <div className="w-full h-40 bg-gradient-to-t from-yellow-900/40 to-yellow-500/10 border-t-4 border-yellow-500 rounded-t-lg flex flex-col items-center justify-end pb-4 relative shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                                            <Trophy className="w-10 h-10 text-yellow-500 mb-2" />
                                            <div className="text-5xl font-bold text-white/20">1</div>
                                        </div>
                                    </div>
                                )}

                                {/* 3rd Place */}
                                {topThree[2] && (
                                    <div className="flex flex-col items-center order-3 w-full md:w-1/3">
                                        <div className="mb-4 text-center">
                                            <div className={`w-20 h-20 rounded-full bg-orange-900/20 border-2 border-orange-700 flex items-center justify-center text-2xl font-bold text-orange-700 mb-2 mx-auto overflow-hidden ${topThree[2].equippedFrame || ''}`}>
                                                {topThree[2].image ? (
                                                    <img src={topThree[2].image} alt={topThree[2].username} className="w-full h-full object-cover" />
                                                ) : (
                                                    topThree[2].username.charAt(0)
                                                )}
                                            </div>
                                            <p className={`font-bold text-white truncate max-w-[150px] ${topThree[2].equippedNameplate || ''}`}>{topThree[2].username}</p>
                                            <p className="text-sm text-primary font-mono">{topThree[2].totalXp.toLocaleString()} XP</p>
                                        </div>
                                        <div className="w-full h-24 bg-gradient-to-t from-orange-900/40 to-orange-700/10 border-t-4 border-orange-700 rounded-t-lg flex flex-col items-center justify-end pb-4 relative">
                                            <Medal className="w-8 h-8 text-orange-700 mb-0" />
                                            <div className="text-4xl font-bold text-white/20">3</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* List */}
                        <Card className="border-white/10 bg-black/40">
                            <CardContent className="p-0">
                                {rest.map((user) => (
                                    <div
                                        key={user.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors",
                                            user.isCurrentUser && "bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 flex items-center justify-center font-mono text-muted">
                                                #{user.rank}
                                            </div>
                                            <div className={`w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden ${user.equippedFrame || ''}`}>
                                                {user.image ? (
                                                    <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-bold text-white">{user.username.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className={cn("font-bold", user.isCurrentUser ? "text-primary" : "text-white", user.equippedNameplate || '')}>
                                                        {user.username}
                                                    </p>
                                                    {user.isCurrentUser && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 bg-primary/20 text-primary hover:bg-primary/30">YOU</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted">{user.squad?.name || "No Squad"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold text-white">{user.totalXp.toLocaleString()} XP</p>
                                            <p className="text-xs text-muted">{Math.floor(user.totalMinutes / 60)}h total</p>
                                        </div>
                                    </div>
                                ))}
                                {leaderboard.length === 0 && (
                                    <div className="p-8 text-center text-muted">
                                        No data available for this period yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </Tabs>
        </div>
    );
}
