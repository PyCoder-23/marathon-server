"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Lock, Trophy, Flame, Clock, Users, BarChart3, Medal, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProfileData {
    profile: {
        id: string;
        username: string;
        image: string | null;
        isLocked: boolean;
        isOwner: boolean;
        squad: { id: string; name: string; rank: number } | null;
        joinedAt: string;
        equippedFrame?: string | null;
        equippedNameplate?: string | null;
        equippedBanner?: string | null;
        equippedBadge?: string | null;
        coins?: number;
    };
    locked: boolean;
    stats?: {
        totalXp: number;
        totalMinutes: number;
        streak: number;
        globalRank: number;
        hallOfFameWins: number;
        weeklyGraph: Array<{
            date: string;
            xp: number;
            hours: number;
            pomodoros: number;
        }>;
    };
}

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!username) return;
        fetchProfile();
    }, [username]);

    async function fetchProfile() {
        try {
            const res = await api.get(`/api/users/profile/${encodeURIComponent(username)}`);
            setData(res);
        } catch (err: any) {
            setError("User not found or inaccessible");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
                <p className="text-muted">{error || "Could not load profile"}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
            </div>
        );
    }

    // LOCKED STATE
    if (data.locked) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh] relative overflow-hidden">
                {/* Background "Content" to simulate blur - using generic placeholders */}
                <div className="absolute inset-0 grid grid-cols-12 gap-4 p-8 opacity-20 pointer-events-none filter blur-xl select-none">
                    <div className="col-span-4 bg-gray-700 h-96 rounded-lg"></div>
                    <div className="col-span-8 bg-gray-800 h-96 rounded-lg"></div>
                    <div className="col-span-12 bg-gray-700 h-40 rounded-lg"></div>
                </div>

                {/* Lock Overlay */}
                <div className="relative z-10 flex flex-col items-center text-center p-12 bg-black/80 backdrop-blur-md rounded-2xl border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                    <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6 ring-1 ring-green-500/50">
                        <Lock className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Profile Locked</h1>
                    <p className="text-muted max-w-md">
                        @{data.profile.username} has limited the visibility of their training data.
                        Only verified personnel (them) can access this information.
                    </p>
                </div>
            </div>
        );
    }

    // UNLOCKED STATE
    const stats = data.stats!;
    const profile = data.profile;

    // Graph Helpers
    const weeklyStats = stats.weeklyGraph || [];
    const xpValues = weeklyStats.map(d => d.xp || 0);
    const minY = Math.min(...xpValues, 0);
    const maxY = Math.max(...xpValues, 100);
    const yRange = maxY - minY || 100;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* LEFT: Profile Card */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="border-white/10 bg-black/40 overflow-hidden relative group">
                        {/* Profile Header (Banner) */}
                        <div
                            className={`absolute top-0 left-0 w-full h-32 ${profile.equippedBanner || 'bg-gradient-to-b from-primary/20 to-transparent'}`}
                            style={profile.equippedBanner?.startsWith('/') ? { backgroundImage: `url(${profile.equippedBanner})` } : {}}
                        ></div>
                        <CardContent className="pt-12 relative z-10 flex flex-col items-center text-center">

                            {/* PFP with Frame */}
                            <div className={cn("w-40 h-40 flex items-center justify-center mb-4 relative", profile.equippedFrame)}>
                                <div className="w-32 h-32 rounded-full border-4 border-black/50 bg-black shadow-lg overflow-hidden">
                                    {profile.image ? (
                                        <img src={profile.image} alt={profile.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-4xl font-bold text-white">
                                            {profile.username.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h1 className={`text-3xl font-bold text-white mb-1 ${profile.equippedNameplate || ''}`}>
                                {profile.username}
                            </h1>
                            <p className="text-muted mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {profile.squad ? profile.squad.name : "Lone Wolf"}
                            </p>

                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 w-full border-t border-white/10 pt-6">
                                <div className="p-2">
                                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Rank</p>
                                    <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                        #{stats.globalRank}
                                    </p>
                                </div>
                                <div className="p-2 border-l border-white/10">
                                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Streak</p>
                                    <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        {stats.streak}
                                    </p>
                                </div>
                                <div className="p-2 border-l border-white/10">
                                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Total</p>
                                    <p className="text-xl font-bold text-white">
                                        {Math.floor(stats.totalMinutes / 60)}h
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Squad Rank Card */}
                    {profile.squad && (
                        <Card className="border-white/10 bg-black/40">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted uppercase tracking-wider">Squad Standing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-white">{profile.squad.name}</p>
                                        <p className="text-sm text-muted">Member</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted">Rank within squad</p>
                                        <p className="text-3xl font-mono font-bold text-primary">#{profile.squad.rank}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Hall of Fame Stats */}
                    <Card className="border-white/10 bg-black/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted uppercase tracking-wider">Legacy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20">
                                    <Crown className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.hallOfFameWins}</p>
                                    <p className="text-sm text-muted">Hall of Fame Wins</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Graph & Detailed Stats */}
                <div className="md:col-span-8 space-y-6">
                    <Card className="border-white/10 h-full max-h-[500px]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] relative">
                                {/* Graph Implementation reusing Dashboard Logic */}
                                {/* Y-axis labels */}
                                <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-muted font-mono">
                                    {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                                        <span key={ratio}>{Math.round(minY + (yRange * ratio)).toLocaleString()}</span>
                                    ))}
                                </div>

                                {/* Graph area */}
                                <div className="absolute left-10 right-0 top-0 bottom-8 pl-2">
                                    <div className="w-full h-full relative border-l border-b border-white/10">
                                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                                            <div key={i} className="absolute w-full border-t border-white/5" style={{ top: `${ratio * 100}%` }} />
                                        ))}

                                        {minY < 0 && maxY > 0 && (
                                            <div className="absolute w-full border-t border-white/20 border-dashed" style={{ top: `${(100 - ((0 - minY) / yRange) * 100)}%` }} />
                                        )}

                                        {weeklyStats.length > 1 && (
                                            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="profileLineGradient" x1="0" y1="0" x2="0" y2="1">
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
                                                    fill="url(#profileLineGradient)"
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
                                        )}

                                        {weeklyStats.length === 1 && (
                                            <div className="absolute left-0 bottom-0 w-full h-full flex items-center justify-center opacity-20">
                                                <div className="w-[2px] h-full bg-primary/20" style={{ left: '50%' }} />
                                            </div>
                                        )}

                                        {/* Points */}
                                        <div className="absolute inset-0">
                                            {weeklyStats.map((day: any, i: number) => {
                                                const xp = day.xp || 0;
                                                const x = (i / (weeklyStats.length - 1)) * 100;
                                                const y = 100 - ((xp - minY) / yRange * 100);
                                                return (
                                                    <div key={i} className="absolute w-2 h-2 -ml-1 rounded-full bg-primary border border-black z-20"
                                                        style={{ left: `${x}%`, top: `calc(${y}% - 4px)` }}
                                                        title={`${xp} XP on ${day.date}`}
                                                    />
                                                );
                                            })}
                                        </div>
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
                                            else className = "absolute top-2 text-xs text-muted -translate-x-1/2 rounded bg-black/50 px-1";

                                            return (
                                                <div key={i} className={className} style={i !== 0 && i !== weeklyStats.length - 1 ? { left: `${x}%` } : {}}>
                                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Stats Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="border-white/10 bg-black/40 p-4 flex items-center gap-4">
                            <Clock className="w-8 h-8 text-blue-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.totalMinutes.toLocaleString()}</p>
                                <p className="text-xs text-muted">Lifetime Minutes</p>
                            </div>
                        </Card>
                        <Card className="border-white/10 bg-black/40 p-4 flex items-center gap-4">
                            <Medal className="w-8 h-8 text-purple-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.totalXp.toLocaleString()}</p>
                                <p className="text-xs text-muted">Lifetime XP</p>
                            </div>
                        </Card>
                        <Card className="border-white/10 bg-black/40 p-4 flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 font-bold text-lg">$</div>
                            <div>
                                <p className="text-2xl font-bold text-white">{profile.coins || 0}</p>
                                <p className="text-xs text-muted">Total Coins</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
