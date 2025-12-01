"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Clock } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export function SessionTimer() {
    const [isRunning, setIsRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [subjectTag, setSubjectTag] = useState("");
    const [showSubjectInput, setShowSubjectInput] = useState(false);
    const [xpEarned, setXpEarned] = useState<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { refreshUser } = useAuth();

    // Check for active session on mount
    useEffect(() => {
        checkActiveSession();
    }, []);

    async function checkActiveSession() {
        try {
            const data = await api.get("/api/sessions/active");
            if (data.session) {
                setSessionId(data.session.id);
                setIsRunning(true);
                // Calculate elapsed time
                const elapsed = Math.floor((Date.now() - new Date(data.session.startTs).getTime()) / 1000);
                setSeconds(elapsed);
            }
        } catch (error) {
            console.error("Failed to check active session:", error);
        }
    }

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    async function handleStart() {
        try {
            const data = await api.post("/api/sessions/start", { subjectTag: subjectTag || undefined });
            setSessionId(data.sessionId);
            setIsRunning(true);
            setSeconds(0);
            setShowSubjectInput(false);
            setXpEarned(null);
        } catch (error: any) {
            alert(error.message || "Failed to start session");
        }
    }

    async function handleStop() {
        if (!sessionId) return;

        const durationMin = Math.floor(seconds / 60);
        if (durationMin < 25) {
            if (!confirm("25 mins are not completed. If you end now, you won't receive any progress. Are you sure?")) {
                return;
            }
        }

        try {
            const data = await api.post("/api/sessions/stop", { sessionId });
            setIsRunning(false);
            setSessionId(null);
            setXpEarned(data.xpEarned);
            setSubjectTag("");

            // Refresh user data to update XP display
            await refreshUser();

            // Clear XP notification after 5 seconds
            setTimeout(() => setXpEarned(null), 5000);
        } catch (error: any) {
            alert(error.message || "Failed to stop session");
        }
    }

    function formatTime(totalSeconds: number) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    const nextXpDrop = 25 - (Math.floor(seconds / 60) % 25);
    const potentialXp = Math.floor(Math.floor(seconds / 60) / 25) * 20;

    return (
        <Card className="border-primary/20 bg-black/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Clock className="w-5 h-5" />
                    Study Session
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Timer Display */}
                <div className="text-center">
                    <div className="text-5xl font-mono font-bold text-white mb-2">
                        {formatTime(seconds)}
                    </div>
                    <p className="text-sm text-muted">
                        {Math.floor(seconds / 60)} minutes • {potentialXp} XP earned
                    </p>
                    {isRunning && (
                        <p className="text-xs text-primary/80 mt-1">
                            Next 20 XP in {nextXpDrop} mins
                        </p>
                    )}
                </div>

                {/* Subject Tag Input */}
                {showSubjectInput && !isRunning && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted">
                            Subject (optional)
                        </label>
                        <Input
                            value={subjectTag}
                            onChange={(e) => setSubjectTag(e.target.value)}
                            placeholder="e.g., Mathematics, Physics"
                            className="bg-black/50"
                        />
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-2">
                    {!isRunning ? (
                        <>
                            {!showSubjectInput ? (
                                <Button
                                    className="flex-1 shadow-[0_0_10px_rgba(0,255,149,0.3)]"
                                    onClick={() => setShowSubjectInput(true)}
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Session
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSubjectInput(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 shadow-[0_0_10px_rgba(0,255,149,0.3)]"
                                        onClick={handleStart}
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        Begin
                                    </Button>
                                </>
                            )}
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={handleStop}
                        >
                            <Square className="w-4 h-4 mr-2" />
                            Stop Session
                        </Button>
                    )}
                </div>

                {/* XP Earned Notification */}
                {xpEarned !== null && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center animate-pulse">
                        <p className="text-primary font-bold text-lg">
                            +{xpEarned} XP Earned!
                        </p>
                        <p className="text-xs text-muted">
                            Great work! Keep it up!
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
