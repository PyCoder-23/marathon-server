"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Flame, Target, Users, Zap, BarChart3, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { SessionTimer } from "@/components/session-timer";

interface Stats {
    today: {
        hours: number;
        pomodoros: number;
        minutes: number;
    };
    weekly: Array<{
        date: string;
        hours: number;
        pomodoros: number;
    }>;
    streak: number;
}

interface Squad {
    id: string;
    name: string;
    slogan: string | null;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [squad, setSquad] = useState<Squad | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [statsData, userData] = await Promise.all([
                api.get("/api/users/stats"),
                api.get("/api/users/me"),
            ]);

            setStats(statsData);

            if (userData.user.squadId) {
                const squadData = await api.get(`/api/squads/${userData.user.squadId}`);
                setSquad(squadData.squad);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Loading your command center...</p>
                </div>
            </div>
        );
    }

    const dailyGoal = 6.0; // hours
    const progressPercent = stats ? Math.min(100, (stats.today.hours / dailyGoal) * 100) : 0;

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
                    <p className="text-muted">Welcome back, {user?.username}. Your training awaits.</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Daily Progress Panel - 4 cols */}
                <Card className="md:col-span-4 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Clock className="w-5 h-5" /> Daily Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm text-muted">Hours Studied</p>
                                <p className="text-4xl font-mono font-bold text-white">
                                    {stats?.today.hours.toFixed(1) || "0.0"}
                                    <span className="text-lg text-muted ml-1">hrs</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted">Goal</p>
                                <p className="text-xl font-mono text-muted">{dailyGoal.toFixed(1)} hrs</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-secondary/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary shadow-[0_0_10px_var(--primary)] transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-muted flex items-center gap-1">
                                    <Target className="w-3 h-3" /> Pomodoros
                                </p>
                                <p className="text-2xl font-bold text-white">{stats?.today.pomodoros || 0}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-muted flex items-center gap-1">
                                    <Flame className="w-3 h-3" /> Streak
                                </p>
                                <p className="text-2xl font-bold text-orange-500">
                                    {stats?.streak || 0}
                                    <span className="text-xs text-muted ml-1">days</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Activity Graph - 8 cols */}
                <Card className="md:col-span-8 border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" /> Weekly XP Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] relative">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-muted font-mono">
                                {(() => {
                                    if (!stats?.weekly || stats.weekly.length === 0) return null;
                                    const maxXp = Math.max(...stats.weekly.map((d: any) => d.xp), 1);
                                    const step = Math.ceil(maxXp / 4);
                                    return [4, 3, 2, 1, 0].map((i) => (
                                        <span key={i}>{(step * i).toLocaleString()}</span>
                                    ));
                                })()}
                            </div>

                            {/* Graph area */}
                            <div className="absolute left-10 right-0 top-0 bottom-8 pl-2">
                                <div className="w-full h-full border-l border-b border-white/10 relative">
                                    {/* Grid lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-full border-t border-white/5"
                                            style={{ top: `${ratio * 100}%` }}
                                        />
                                    ))}

                                    {/* Bar chart */}
                                    {stats?.weekly && stats.weekly.length > 0 && (
                                        <div className="absolute inset-0 flex items-end gap-1 px-2">
                                            {stats.weekly.map((day: any, i: number) => {
                                                const maxXp = Math.max(...stats.weekly.map((d: any) => d.xp), 1);
                                                const heightPercent = (day.xp / maxXp) * 100;

                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex-1 group relative flex flex-col justify-end"
                                                    >
                                                        {/* Bar */}
                                                        <div
                                                            className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                                                            style={{ height: `${heightPercent}%` }}
                                                        />

                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                            <div className="font-bold text-primary">{day.xp} XP</div>
                                                            <div className="text-muted">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* X-axis labels */}
                            <div className="absolute left-10 right-0 bottom-0 h-8 pl-2">
                                <div className="w-full h-full flex items-start gap-1 px-2">
                                    {stats?.weekly.map((day: any, i: number) => (
                                        <div key={i} className="flex-1 text-center text-xs text-muted">
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Session Timer - 6 cols */}
                <div className="md:col-span-6">
                    <SessionTimer />
                </div>

                {/* Squad Summary - 6 cols */}
                <Card className="md:col-span-6 border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" /> Squad Status
                        </CardTitle>
                        <CardDescription>{squad?.name || "No Squad"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {squad ? (
                            <>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary font-bold">
                                            {squad.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{squad.name}</p>
                                            <p className="text-xs text-muted">{squad.slogan || "No slogan"}</p>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/squads/${squad.id}`}>
                                    <Button variant="outline" className="w-full">
                                        View Squad Details
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted mb-4">You're not in a squad yet</p>
                                <Link href="/squads">
                                    <Button>Join a Squad</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions - 12 cols */}
                <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/missions" className="contents">
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/5">
                            <Target className="w-6 h-6 text-cyan-400" />
                            <span>View Missions</span>
                        </Button>
                    </Link>
                    <Link href="/squads" className="contents">
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:border-white/30 hover:bg-white/5">
                            <Users className="w-6 h-6" />
                            <span>Browse Squads</span>
                        </Button>
                    </Link>
                    <Link href="/leaderboard" className="contents">
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/5">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <span>Leaderboard</span>
                        </Button>
                    </Link>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:border-primary/50 hover:bg-primary/5" disabled>
                        <Zap className="w-6 h-6 text-primary" />
                        <span>History</span>
                    </Button>
                </div>

            </div>
        </div>
    );
}
