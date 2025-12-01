"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Timer, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { SquadRankBadge } from "@/components/squad-rank-badge";

interface Squad {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    totalXp: number;
    averageXp: number;
    rank: number;
}

export default function SquadsPage() {
    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSquads();
    }, []);

    async function fetchSquads() {
        try {
            const data = await api.get("/api/squads");
            setSquads(data.squads);
        } catch (error) {
            console.error("Failed to fetch squads:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Loading squads...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Squads</h1>
                    <p className="text-muted">Join a team, compete for glory, and dominate the leaderboard.</p>
                </div>
                {/* Admin only button in future */}
                {/* <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Squad
                </Button> */}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {squads.map((squad) => (
                    <Card key={squad.id} className="border-white/10 bg-black/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Rank & Icon */}
                                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                                    <div className="text-4xl font-bold text-white/20 group-hover:text-primary/50 transition-colors">
                                        #{squad.rank}
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 text-2xl font-bold text-primary">
                                        {squad.name.charAt(0)}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-left space-y-2">
                                    <div>
                                        <SquadRankBadge rank={squad.rank} squadName={squad.name} />
                                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                                            {squad.name}
                                        </h3>
                                    </div>
                                    <p className="text-muted max-w-xl">
                                        {squad.description}
                                    </p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted pt-2">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{squad.memberCount} Members</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Trophy className="w-4 h-4" />
                                            <span>{squad.totalXp.toLocaleString()} XP</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Timer className="w-4 h-4" />
                                            <span>Avg {squad.averageXp.toLocaleString()} XP/member</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="min-w-[150px]">
                                    <Link href={`/squads/${squad.id}`}>
                                        <Button className="w-full shadow-[0_0_15px_rgba(0,255,149,0.1)] group-hover:shadow-[0_0_20px_rgba(0,255,149,0.3)] transition-all">
                                            View Squad
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
