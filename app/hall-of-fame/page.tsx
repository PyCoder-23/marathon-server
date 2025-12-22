"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Users, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Winner {
    id: string;
    period: string;
    name: string;
    image?: string | null;
    totalXp: number;
    rank: number;
    equippedFrame?: string;
    equippedNameplate?: string;
}

export default function HallOfFamePage() {
    const [monthlySquadWinners, setMonthlySquadWinners] = useState<Winner[]>([]);
    const [weeklySquadWinners, setWeeklySquadWinners] = useState<Winner[]>([]);
    const [monthlyUserWinners, setMonthlyUserWinners] = useState<Winner[]>([]);
    const [weeklyUserWinners, setWeeklyUserWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHallOfFame();
    }, []);

    async function fetchHallOfFame() {
        setLoading(true);
        try {
            const data = await api.get("/api/hall-of-fame");
            setMonthlySquadWinners(data.monthlySquadWinners || []);
            setWeeklySquadWinners(data.weeklySquadWinners || []);
            setMonthlyUserWinners(data.monthlyUserWinners || []);
            setWeeklyUserWinners(data.weeklyUserWinners || []);
        } catch (error) {
            console.error("Failed to fetch hall of fame:", error);
        } finally {
            setLoading(false);
        }
    }

    const renderWinnerCard = (winner: Winner, showImage: boolean = false) => {
        const getRankIcon = (rank: number) => {
            if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
            if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
            if (rank === 3) return <Medal className="w-5 h-5 text-orange-700" />;
            return null;
        };

        const getRankColor = (rank: number) => {
            if (rank === 1) return "border-yellow-500/50 bg-yellow-500/5";
            if (rank === 2) return "border-gray-400/50 bg-gray-400/5";
            if (rank === 3) return "border-orange-700/50 bg-orange-700/5";
            return "border-white/10 bg-white/5";
        };

        return (
            <div
                key={winner.id}
                className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all hover:bg-white/10",
                    getRankColor(winner.rank)
                )}
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {getRankIcon(winner.rank)}
                        <span className="font-mono text-sm text-muted">#{winner.rank}</span>
                    </div>
                    {showImage && (
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center relative shrink-0 overflow-visible", winner.equippedFrame)}>
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-black">
                                {winner.image ? (
                                    <img src={winner.image} alt={winner.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">{winner.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div>
                        <p className={cn("font-bold text-white", winner.equippedNameplate)}>{winner.name}</p>
                        <p className="text-xs text-muted">{winner.period}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-mono font-bold text-primary">{winner.totalXp.toLocaleString()} XP</p>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <h1 className="text-3xl font-bold text-white tracking-tight">Hall of Fame</h1>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-muted">Celebrating our champions across all time</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted">Loading champions...</p>
                    </div>
                </div>
            ) : (
                <Tabs defaultValue="monthly-squads" className="w-full max-w-4xl mx-auto">
                    <div className="flex justify-center mb-8">
                        <TabsList className="bg-black/40 border border-white/10">
                            <TabsTrigger value="monthly-squads">
                                <Users className="w-4 h-4 mr-2" />
                                Monthly Squads
                            </TabsTrigger>
                            <TabsTrigger value="weekly-squads">
                                <Users className="w-4 h-4 mr-2" />
                                Weekly Squads
                            </TabsTrigger>
                            <TabsTrigger value="monthly-users">
                                <UserIcon className="w-4 h-4 mr-2" />
                                Monthly Users
                            </TabsTrigger>
                            <TabsTrigger value="weekly-users">
                                <UserIcon className="w-4 h-4 mr-2" />
                                Weekly Users
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="monthly-squads">
                        <Card className="border-white/10 bg-black/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Monthly Squad Champions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {monthlySquadWinners.length > 0 ? (
                                    monthlySquadWinners.map((winner) => renderWinnerCard(winner, false))
                                ) : (
                                    <p className="text-center text-muted py-8">No monthly squad winners yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="weekly-squads">
                        <Card className="border-white/10 bg-black/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Medal className="w-5 h-5 text-primary" />
                                    Weekly Squad Champions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {weeklySquadWinners.length > 0 ? (
                                    weeklySquadWinners.map((winner) => renderWinnerCard(winner, false))
                                ) : (
                                    <p className="text-center text-muted py-8">No weekly squad winners yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="monthly-users">
                        <Card className="border-white/10 bg-black/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Monthly User Champions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {monthlyUserWinners.length > 0 ? (
                                    monthlyUserWinners.map((winner) => renderWinnerCard(winner, true))
                                ) : (
                                    <p className="text-center text-muted py-8">No monthly user winners yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="weekly-users">
                        <Card className="border-white/10 bg-black/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Medal className="w-5 h-5 text-primary" />
                                    Weekly User Champions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {weeklyUserWinners.length > 0 ? (
                                    weeklyUserWinners.map((winner) => renderWinnerCard(winner, true))
                                ) : (
                                    <p className="text-center text-muted py-8">No weekly user winners yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
