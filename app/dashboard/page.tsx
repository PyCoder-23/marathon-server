"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Flame, Target, Users, Zap, BarChart3, Trophy, History as HistoryIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { SessionTimer } from "@/components/session-timer";
import { cn } from "@/lib/utils";

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
        xp: number;
    }>;
    streak: number;
}

interface Squad {
    id: string;
    name: string;
    slogan: string | null;
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [squad, setSquad] = useState<Squad | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        }
    }, [authLoading, user]);

    async function fetchData() {
        try {
            const promises = [api.get("/api/users/stats")];
            
            if (user?.squadId) {
                promises.push(api.get(`/api/squads/${user.squadId}`));
            }

            const results = await Promise.all(promises);
            setStats(results[0]);
            
            if (results[1]) {
                setSquad(results[1].squad);
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

    // Graph Scale Calculations (Nice Numbers Algorithm)
    const weeklyStats = stats?.weekly || [];
    const xpValues = weeklyStats.map(d => d.xp || 0);
    const rawMinY = Math.min(...xpValues, 0); // Always include 0
    const rawMaxY = Math.max(...xpValues, 100); // Default max 100 if empty/low

    const calculateNiceScale = (min: number, max: number, tickCount: number = 5) => {
        if (min === max) {
            return { min: 0, max: 100, step: 25, ticks: [0, 25, 50, 75, 100] };
        }

        const range = max - min;
        const roughStep = range / (tickCount - 1);
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalizedStep = roughStep / magnitude;

        let niceNormalizedStep;
        if (normalizedStep <= 1) niceNormalizedStep = 1;
        else if (normalizedStep <= 2) niceNormalizedStep = 2;
        else if (normalizedStep <= 5) niceNormalizedStep = 5;
        else niceNormalizedStep = 10;

        const step = niceNormalizedStep * magnitude;
        const niceMin = Math.floor(min / step) * step;
        const niceMax = Math.ceil(max / step) * step;

        // Generate ticks
        const ticks = [];
        for (let v = niceMin; v <= niceMax + (step * 0.1); v += step) {
            ticks.push(v);
        }

        return { min: niceMin, max: niceMax, step, ticks };
    };

    const { min: minY, max: maxY, ticks: yTicks } = calculateNiceScale(rawMinY, rawMaxY, 5);
    const yRange = maxY - minY;

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className={cn("w-20 h-20 rounded-full flex items-center justify-center relative shrink-0", user?.equippedFrame)}>
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-black border border-white/10">
                            {user?.image ? (
                                <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">{user?.username.charAt(0).toUpperCase()}</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className={cn("text-3xl font-bold text-white tracking-tight", user?.equippedNameplate)}>
                            Welcome back, {user?.username}
                        </h1>
                        <p className="text-muted">Your training awaits. Rank up your squad!</p>
                    </div>
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

                        <div className="grid grid-cols-3 gap-2 pt-2">
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <p className="text-[10px] text-muted flex items-center gap-1 uppercase tracking-wider">
                                    <Target className="w-3 h-3" /> Pomo
                                </p>
                                <p className="text-xl font-bold text-white">{stats?.today.pomodoros || 0}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <p className="text-[10px] text-muted flex items-center gap-1 uppercase tracking-wider">
                                    <Flame className="w-3 h-3" /> Streak
                                </p>
                                <p className="text-xl font-bold text-orange-500">
                                    {stats?.streak || 0}
                                </p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <p className="text-[10px] text-muted flex items-center gap-1 uppercase tracking-wider">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-[8px] font-bold">$</span> Coins
                                </p>
                                <p className="text-xl font-bold text-yellow-500">
                                    {user?.coins || 0}
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
                                {[...yTicks].reverse().map((tick) => (
                                    <span key={tick}>{tick.toLocaleString()}</span>
                                ))}
                            </div>

                            {/* Graph area */}
                            <div className="absolute left-10 right-0 top-0 bottom-8 pl-2">
                                <div className="w-full h-full relative border-l border-b border-white/10">
                                    {/* Grid lines */}
                                    {yTicks.map((tick) => {
                                        const ratio = (tick - minY) / yRange;
                                        return (
                                            <div
                                                key={tick}
                                                className="absolute w-full border-t border-white/5"
                                                style={{ bottom: `${ratio * 100}%` }}
                                            />
                                        );
                                    })}

                                    {/* Zero Line (highlighted if visible) */}
                                    {minY < 0 && maxY > 0 && (
                                        <div
                                            className="absolute w-full border-t border-white/20 border-dashed"
                                            style={{ top: `${(100 - ((0 - minY) / yRange) * 100)}%` }}
                                        />
                                    )}

                                    {/* Line Graph */}
                                    {weeklyStats.length > 1 ? (
                                        <>
                                            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
                                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <path
                                                    d={`
                                                         M 0,100
                                                         ${weeklyStats.map((day: any, i: number) => {
                                                        const x = (i / (weeklyStats.length - 1)) * 100;
                                                        const y = 100 - (((day.xp || 0) - minY) / yRange) * 100;
                                                        return `L ${x},${y}`;
                                                    }).join(' ')}
                                                         L 100,100 Z
                                                     `}
                                                    fill="url(#lineGradient)"
                                                    fillOpacity="0.2"
                                                />
                                                <polyline
                                                    points={weeklyStats.map((day: any, i: number) => {
                                                        const x = (i / (weeklyStats.length - 1)) * 100;
                                                        const y = 100 - (((day.xp || 0) - minY) / yRange) * 100;
                                                        return `${x},${y}`;
                                                    }).join(' ')}
                                                    fill="none"
                                                    stroke="var(--primary)"
                                                    strokeWidth="2"
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                            </svg>

                                            {/* Bar for single data point or just points */}
                                            <div className="absolute inset-0">
                                                {weeklyStats.map((day: any, i: number) => {
                                                    const xp = day.xp || 0;
                                                    const x = (i / (weeklyStats.length - 1)) * 100;
                                                    const y = 100 - ((xp - minY) / yRange * 100);

                                                    return (
                                                        <div key={i} className="absolute top-0 bottom-0 w-12 -translate-x-1/2 group z-10" style={{ left: `${x}%` }}>
                                                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <div
                                                                className={`absolute left-1/2 w-3 h-3 -ml-1.5 rounded-full border-2 z-20 ${xp < 0 ? 'bg-red-500 border-red-500' : 'bg-black border-primary'}`}
                                                                style={{ top: `calc(${y}% - 6px)` }}
                                                            />
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                                                                <div className={`font-bold ${xp < 0 ? 'text-red-500' : 'text-primary'}`}>{xp} XP</div>
                                                                <div className="text-muted">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : weeklyStats.length === 1 ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative group">
                                                <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-xs px-2 py-1 rounded border border-white/10 opacity-100 whitespace-nowrap">
                                                    <div className="font-bold text-primary">{weeklyStats[0].xp} XP</div>
                                                    <div className="text-muted">Today</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* X-axis labels */}
                            <div className="absolute left-10 right-0 bottom-0 h-8 pl-2">
                                <div className="w-full h-full relative">
                                    {weeklyStats.map((day: any, i: number) => {
                                        const x = (i / (weeklyStats.length - 1)) * 100;
                                        let className = "absolute top-2 text-xs text-muted transform -translate-x-1/2";
                                        if (i === 0) className = "absolute top-2 text-xs text-muted left-0";
                                        else if (i === weeklyStats.length - 1) className = "absolute top-2 text-xs text-muted right-0";
                                        else className = "absolute top-2 text-xs text-muted -translate-x-1/2";

                                        const style = (i !== 0 && i !== weeklyStats.length - 1) ? { left: `${x}%` } : {};

                                        return (
                                            <div key={i} className={className} style={style}>
                                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Session Timer - 6 cols */}
                <div className="md:col-span-6">
                    <SessionTimer onComplete={fetchData} />
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
                    <Link href="/history" className="contents">
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:border-primary/50 hover:bg-primary/5">
                            <HistoryIcon className="w-6 h-6 text-primary" />
                            <span>History</span>
                        </Button>
                    </Link>
                </div>

            </div>
        </div>
    );
}
