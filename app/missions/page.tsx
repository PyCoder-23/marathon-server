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
import { useToast } from "@/components/ui/toast-context";

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
    const { toast } = useToast();

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
            toast({
                title: "Failed to start mission",
                description: error.message || "Please try again",
                variant: "destructive"
            });
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
                toast({
                    title: "🎉 Mission Complete!",
                    description: `You earned +${data.xpAwarded} XP`,
                    variant: "success"
                });
            } else {
                toast({
                    title: "Not Yet Complete",
                    description: "Mission criteria not yet met. Keep training!",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Failed to complete mission",
                description: error.message || "Please try again",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleAbandonMission(progressId: string) {
        // Check if user has Mission Escape Cards
        if (!user || (user.missionPardons || 0) === 0) {
            toast({
                title: "No Mission Escape Cards",
                description: "Purchase Mission Escape Cards from the shop to abandon missions!",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);
            const res = await api.post("/api/missions/withdraw", { progressId });

            // Show celebration animation
            showEscapeAnimation();

            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 3500));

            await fetchMissions();
            await refreshUser();

            toast({
                title: "🎉 Mission Dropped Successfully!",
                description: "Used 1 Mission Escape Card",
                variant: "success"
            });
        } catch (error: any) {
            toast({
                title: "Failed to abandon mission",
                description: error.message || "Please try again",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    function showEscapeAnimation() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md';
        overlay.style.animation = 'fadeIn 0.4s ease-out forwards';

        const container = document.createElement('div');
        container.className = 'relative flex flex-col items-center justify-center';
        container.innerHTML = `
            <div class="relative flex flex-col items-center">
                <!-- Lock Animation Container -->
                <div class="lock-container mb-8 relative" style="width: 150px; height: 150px; display: flex; items-center; justify-center;">
                    <div id="lock-emoji" class="text-8xl select-none" style="animation: lockClosed 0.8s ease-in-out infinite alternate;">🔒</div>
                </div>
                
                <!-- Success message -->
                <div class="text-center opacity-0 translate-y-4" id="escape-message" style="transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <h2 class="text-5xl font-black text-primary mb-3 tracking-tighter">MISSION ESCAPED</h2>
                    <p class="text-xl text-white/60 font-medium">PENALTY NEGATED ⚡</p>
                </div>
            </div>
        `;

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Add CSS animations
        const style = document.createElement('style');
        style.id = 'escape-animation-style';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes lockClosed {
                from { transform: scale(1) rotate(-5deg); }
                to { transform: scale(1.05) rotate(5deg); }
            }
            @keyframes lockOpenPop {
                0% { transform: scale(1); }
                50% { transform: scale(1.4); }
                100% { transform: scale(1); }
            }
            .firework-particle {
                position: absolute;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);

        const lockEmoji = document.getElementById('lock-emoji');
        const message = document.getElementById('escape-message');

        // Animation Sequence
        setTimeout(() => {
            if (lockEmoji) {
                // Unlock!
                lockEmoji.innerText = '🔓';
                lockEmoji.style.animation = 'lockOpenPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

                // Show message
                if (message) {
                    message.classList.remove('opacity-0', 'translate-y-4');
                    message.classList.add('opacity-100', 'translate-y-0');
                }

                // Burst effect
                createBurst(lockEmoji);
            }
        }, 1200);

        function createBurst(parent: HTMLElement) {
            const colors = ['#00ff95', '#ffffff', '#fbbf24'];
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework-particle';
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.backgroundColor = color;
                particle.style.boxShadow = `0 0 10px ${color}`;

                const angle = Math.random() * Math.PI * 2;
                const velocity = 5 + Math.random() * 10;
                const tx = Math.cos(angle) * 150;
                const ty = Math.sin(angle) * 150;

                parent.appendChild(particle);

                particle.animate([
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
                ], {
                    duration: 1000 + Math.random() * 500,
                    easing: 'cubic-bezier(0, .9, .57, 1)',
                    fill: 'forwards'
                });
            }
        }

        // Cleanup
        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.4s ease-out forwards';
            setTimeout(() => {
                if (document.body.contains(overlay)) document.body.removeChild(overlay);
                const styleEl = document.getElementById('escape-animation-style');
                if (styleEl) document.head.removeChild(styleEl);
            }, 400);
        }, 3500);
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
                                onWithdraw={() => handleAbandonMission(mission.progressId || mission.id)}
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
                                onWithdraw={() => handleAbandonMission(mission.progressId || mission.id)}
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
                                onWithdraw={() => handleAbandonMission(mission.progressId || mission.id)}
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
                                onWithdraw={() => handleAbandonMission(mission.progressId || mission.id)}
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
                        <Button onClick={onComplete} size="sm" className="bg-primary hover:bg-primary/90 text-black">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Complete
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={!user || (user.missionPardons || 0) === 0}
                                >
                                    {(user?.missionPardons || 0) > 0 ? "Use Card ⚡" : "No Cards"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Abandon Mission?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will use 1 Mission Escape Card to abandon this mission without penalty.
                                        You currently have {user?.missionPardons || 0} card(s).
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel className="border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white border-0"
                                        onClick={onWithdraw}
                                        disabled={!user || (user.missionPardons || 0) === 0}
                                    >
                                        Use Card ⚡
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
                {
                    mission.status === "COMPLETED" && (
                        <Button variant="ghost" className="w-full text-green-400 cursor-default hover:text-green-400 hover:bg-transparent">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completed
                        </Button>
                    )
                }
            </CardFooter >
        </Card >
    );
}
