"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Timer, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface SquadMember {
    id: string;
    username: string;
    image?: string | null;
    totalXp: number;
    totalMinutes: number;
    streakDays: number;
    isAdmin: boolean;
}

interface SquadDetails {
    id: string;
    name: string;
    description: string;
    slogan: string | null;
    members: SquadMember[];
    totalXp: number;
    totalMinutes: number;
    rank: number;
}

export default function SquadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [squad, setSquad] = useState<SquadDetails | null>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (params.id) {
            fetchSquadDetails(params.id as string);
        }
    }, [params.id]);

    async function fetchSquadDetails(id: string) {
        try {
            const data = await api.get(`/api/squads/${id}`);
            setSquad(data.squad);
        } catch (error) {
            console.error("Failed to fetch squad details:", error);
        } finally {
            setLoading(false);
        }
    }

    // Joining logic removed as per requirements

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Loading squad details...</p>
                </div>
            </div>
        );
    }

    if (!squad) {
        return (
            <div className="container mx-auto p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Squad Not Found</h1>
                <Link href="/squads">
                    <Button>Back to Squads</Button>
                </Link>
            </div>
        );
    }

    const isMember = user?.squadId === squad.id;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <Link href="/squads">
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-muted hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Squads
                </Button>
            </Link>

            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                <div className="relative p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary text-3xl font-bold text-primary">
                                {squad.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white tracking-tight">{squad.name}</h1>
                                <p className="text-xl text-primary/80 font-mono">{squad.slogan || "No slogan set"}</p>
                            </div>
                        </div>
                        <p className="text-muted max-w-2xl text-lg">
                            {squad.description}
                        </p>
                        <div className="flex gap-6 text-sm text-muted">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {squad.members.length} Members
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                Rank #{squad.rank}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                            <p className="text-sm text-muted mb-1">Total XP</p>
                            <p className="text-2xl font-bold text-white">{squad.totalXp.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                            <p className="text-sm text-muted mb-1">Total Hours</p>
                            <p className="text-2xl font-bold text-white">{Math.floor(squad.totalMinutes / 60).toLocaleString()}</p>
                        </div>
                        {!isMember && (
                            <div className="w-full mt-2 p-3 bg-white/5 rounded border border-white/10 text-center text-sm text-muted">
                                You are in a different squad
                            </div>
                        )}
                        {isMember && (
                            <Button variant="outline" className="w-full border-primary/50 text-primary cursor-default hover:bg-primary/10">
                                <Shield className="w-4 h-4 mr-2" />
                                Member
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Roster */}
            <Card className="border-white/10 bg-black/40">
                <CardHeader>
                    <CardTitle>Squad Roster</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {squad.members.map((member, index) => (
                            <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-6 text-center text-sm font-mono text-muted">
                                        #{index + 1}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                                        {member.image ? (
                                            <img src={member.image} alt={member.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-white">{member.username.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white">{member.username}</p>
                                            {member.isAdmin && (
                                                <Badge variant="secondary" className="text-[10px] h-5">Admin</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted">{member.streakDays} day streak</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-primary">{member.totalXp.toLocaleString()} XP</p>
                                    <p className="text-xs text-muted">{Math.floor(member.totalMinutes / 60)}h total</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
