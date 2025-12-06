"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Star, Timer, Trophy, Target, AlertTriangle, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface Mission {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    type: "DAILY" | "WEEKLY" | "LONG_TERM";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    status: "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
    progressId?: string;
}

export default function MissionsPage() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        fetchMissions();
    }, []);

    async function fetchMissions() {
        try {
            const data = await api.get("/api/missions");
            setMissions(data.missions);
        } catch (error) {
            console.error("Failed to fetch missions:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleStartMission(missionId: string) {
        try {
            setLoading(true);
            await api.post("/api/missions/start", { missionId });
            await fetchMissions();
        } catch (error: any) {
            alert(error.message || "Failed to start mission");
        } finally {
            setLoading(false);
        }
    }

    async function handleCompleteMission(missionId: string) {
        try {
            setLoading(true);
            const data = await api.post("/api/missions/complete", { missionId });
            if (data.completed) {
                await fetchMissions();
                await refreshUser();
                alert(`🎉 Mission Complete! +${data.xpAwarded} XP`);
            } else {
                alert("❌ Mission criteria not yet met. Keep training!");
            }
        } catch (error: any) {
            alert(error.message || "Failed to complete mission");
        } finally {
            setLoading(false);
        }
    }

    async function handleWithdraw(missionId: string) {
        try {
            setLoading(true);
            const res = await api.post("/api/missions/withdraw", { missionId });
            await fetchMissions();
            await refreshUser();
            const method = res.method === "PARDON" ? "Used 1 Mission Pardon" : "Paid 50 Coins";
            alert(`Withdrawn successfully (${method})`);
        } catch (error: any) {
            alert(error.message || "Failed to withdraw");
        } finally {
            setLoading(false);
        }
    }

    const dailyMissions = missions.filter(m => m.type === "DAILY");
    const weeklyMissions = missions.filter(m => m.type === "WEEKLY");
    const longTermMissions = missions.filter(m => m.type === "LONG_TERM");

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted">Loading mission data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Mission Board</h1>
                <p className="text-muted">Complete objectives to earn XP and rank up your squad.</p>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-white/10">
                    <TabsTrigger value="all">All Missions</TabsTrigger>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="longterm">Long Term</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {missions.map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                user={user}
                                onStart={() => handleStartMission(mission.id)}
                                onComplete={() => handleCompleteMission(mission.id)}
                                onWithdraw={() => handleWithdraw(mission.id)}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="daily" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dailyMissions.map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                user={user}
                                onStart={() => handleStartMission(mission.id)}
                                onComplete={() => handleCompleteMission(mission.id)}
                                onWithdraw={() => handleWithdraw(mission.id)}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="weekly" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weeklyMissions.map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                user={user}
                                onStart={() => handleStartMission(mission.id)}
                                onComplete={() => handleCompleteMission(mission.id)}
                                onWithdraw={() => handleWithdraw(mission.id)}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="longterm" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {longTermMissions.map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                user={user}
                                onStart={() => handleStartMission(mission.id)}
                                onComplete={() => handleCompleteMission(mission.id)}
                                onWithdraw={() => handleWithdraw(mission.id)}
                            />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MissionCard({
    mission,
    user,
    onStart,
    onComplete,
    onWithdraw
}: {
    mission: Mission;
    user: any;
    onStart: () => void;
    onComplete: () => void;
    onWithdraw: () => void;
}) {
    const difficultyColor: Record<string, string> = {
        EASY: "text-green-400 border-green-400/30 bg-green-400/10",
        MEDIUM: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
        HARD: "text-red-400 border-red-400/30 bg-red-400/10",
    };

    return (
        <Card className={`border-white/10 bg-black/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group ${mission.status === 'COMPLETED' ? 'opacity-70' : ''}`}>
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={difficultyColor[mission.difficulty] || difficultyColor.EASY}>
                        {mission.difficulty}
                    </Badge>
                    <div className="flex items-center text-primary font-mono text-sm">
                        <Star className="w-3 h-3 mr-1 fill-primary" />
                        {mission.xpReward} XP
                    </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {mission.title}
                </CardTitle>
                <CardDescription>
                    {mission.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted">
                    {mission.type === "DAILY" && <Timer className="w-4 h-4" />}
                    {mission.type === "WEEKLY" && <Trophy className="w-4 h-4" />}
                    {mission.type === "LONG_TERM" && <Target className="w-4 h-4" />}
                    <span>{mission.type.replace("_", " ")} Mission</span>
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                {mission.status === "AVAILABLE" && (
                    <Button
                        className="w-full shadow-[0_0_10px_rgba(0,255,149,0.2)]"
                        onClick={onStart}
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Accept Mission
                    </Button>
                )}
                {mission.status === "IN_PROGRESS" && (
                    <>
                        <Button
                            variant="secondary"
                            className="flex-1 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border border-yellow-500/50"
                            onClick={onComplete}
                        >
                            Check Progress
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
                                    <AlertTriangle className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-black border-white/10 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Withdraw from Mission?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will cancel the mission without an XP penalty.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <div className="py-4 space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted">Mission Pardons (Owned):</span>
                                        <span className={(user?.missionPardons || 0) > 0 ? "text-green-400 font-bold" : "text-white"}>
                                            {user?.missionPardons || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted">Or Pay Coins:</span>
                                        <span className="text-yellow-500 font-bold">50 C</span>
                                    </div>
                                    <div className="text-xs text-muted pt-2 text-right">
                                        Your Balance: <span className="text-yellow-500">{user?.coins || 0} C</span>
                                    </div>
                                </div>

                                <AlertDialogFooter>
                                    <AlertDialogCancel className="border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white border-0"
                                        onClick={onWithdraw}
                                        disabled={!user || ((user.missionPardons || 0) === 0 && (user.coins || 0) < 50)}
                                    >
                                        {(user?.missionPardons || 0) > 0 ? "Use Pardon" : "Pay 50 Coins"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
                {mission.status === "COMPLETED" && (
                    <Button variant="ghost" className="w-full text-green-400 cursor-default hover:text-green-400 hover:bg-transparent">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Completed
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
