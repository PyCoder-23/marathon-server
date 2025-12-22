"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, BookOpen, Heart, Plus, ChevronLeft, ChevronRight, Trash2, Activity } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-context";

interface JournalEntry {
    id: string;
    type: string;
    date: string;
    habitName?: string;
    habitCompleted?: boolean;
    habitNotes?: string;
    gratitudeTitle?: string;
    gratitudeContent?: string;
    gratitudeMood?: string;
    healthCategory?: string;
    healthTitle?: string;
    healthContent?: string;
    healthRating?: number;
}

export default function JournalPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [habitEntries, setHabitEntries] = useState<JournalEntry[]>([]);
    const [gratitudeEntry, setGratitudeEntry] = useState<JournalEntry | null>(null);
    const [healthEntries, setHealthEntries] = useState<{
        mental: JournalEntry | null;
        physical: JournalEntry | null;
        food: JournalEntry | null;
    }>({ mental: null, physical: null, food: null });
    const [loading, setLoading] = useState(true);

    // New habit form
    const [newHabitName, setNewHabitName] = useState("");
    const [showHabitForm, setShowHabitForm] = useState(false);

    // Gratitude form
    const [gratitudeTitle, setGratitudeTitle] = useState("");
    const [gratitudeContent, setGratitudeContent] = useState("");
    const [gratitudeMood, setGratitudeMood] = useState("");

    // Health form states
    const [healthForms, setHealthForms] = useState({
        mental: { title: "", content: "", rating: 0 },
        physical: { title: "", content: "", rating: 0 },
        food: { title: "", content: "", rating: 0 }
    });

    useEffect(() => {
        fetchEntries();
    }, [currentDate]);

    // Star hover states
    const [starHover, setStarHover] = useState<{
        mental: number | null;
        physical: number | null;
        food: number | null;
    }>({ mental: null, physical: null, food: null });

    async function fetchEntries() {
        try {
            setLoading(true);
            const dateStr = currentDate.toISOString().split('T')[0];
            const data = await api.get(`/api/journal?date=${dateStr}`);

            const habits = data.entries.filter((e: JournalEntry) => e.type === "HABIT");
            const gratitude = data.entries.find((e: JournalEntry) => e.type === "GRATITUDE");
            const healthEntriesData = data.entries.filter((e: JournalEntry) => e.type === "HEALTH");

            setHabitEntries(habits);
            setGratitudeEntry(gratitude || null);

            // Set health entries by category
            const mental = healthEntriesData.find((e: JournalEntry) => e.healthCategory === "mental");
            const physical = healthEntriesData.find((e: JournalEntry) => e.healthCategory === "physical");
            const food = healthEntriesData.find((e: JournalEntry) => e.healthCategory === "food");

            setHealthEntries({ mental: mental || null, physical: physical || null, food: food || null });

            // Set health form states
            setHealthForms({
                mental: {
                    title: mental?.healthTitle || "",
                    content: mental?.healthContent || "",
                    rating: mental?.healthRating || 0
                },
                physical: {
                    title: physical?.healthTitle || "",
                    content: physical?.healthContent || "",
                    rating: physical?.healthRating || 0
                },
                food: {
                    title: food?.healthTitle || "",
                    content: food?.healthContent || "",
                    rating: food?.healthRating || 0
                }
            });

            if (gratitude) {
                setGratitudeTitle(gratitude.gratitudeTitle || "");
                setGratitudeContent(gratitude.gratitudeContent || "");
                setGratitudeMood(gratitude.gratitudeMood || "");
            } else {
                setGratitudeTitle("");
                setGratitudeContent("");
                setGratitudeMood("");
            }
        } catch (error) {
            console.error("Failed to fetch journal entries:", error);
        } finally {
            setLoading(false);
        }
    }

    async function addHabit() {
        if (!newHabitName.trim()) return;

        try {
            const dateStr = currentDate.toISOString().split('T')[0];
            await api.post("/api/journal", {
                type: "HABIT",
                date: dateStr,
                habitName: newHabitName,
                habitCompleted: false,
                habitNotes: ""
            });

            setNewHabitName("");
            setShowHabitForm(false);
            await fetchEntries();

            toast({
                title: "Habit Added",
                description: `"${newHabitName}" added to today's habits`,
                variant: "success"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add habit",
                variant: "destructive"
            });
        }
    }

    async function toggleHabit(entry: JournalEntry) {
        try {
            await api.put(`/api/journal/${entry.id}`, {
                habitCompleted: !entry.habitCompleted
            });
            await fetchEntries();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update habit",
                variant: "destructive"
            });
        }
    }

    async function updateHabitNotes(entry: JournalEntry, notes: string) {
        try {
            // Update local state immediately for better UX
            setHabitEntries(prev =>
                prev.map(e => e.id === entry.id ? { ...e, habitNotes: notes } : e)
            );

            // Debounced API call
            await api.put(`/api/journal/${entry.id}`, {
                habitCompleted: entry.habitCompleted,
                habitNotes: notes
            });
        } catch (error) {
            console.error("Failed to update notes:", error);
            toast({
                title: "Error",
                description: "Failed to save notes",
                variant: "destructive"
            });
            // Revert on error
            await fetchEntries();
        }
    }

    async function deleteHabit(entry: JournalEntry) {
        try {
            await api.delete(`/api/journal/${entry.id}`);
            await fetchEntries();
            toast({
                title: "Deleted",
                description: "Habit removed",
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete habit",
                variant: "destructive"
            });
        }
    }

    async function saveGratitude() {
        if (!gratitudeTitle.trim() && !gratitudeContent.trim()) return;

        try {
            const dateStr = currentDate.toISOString().split('T')[0];

            if (gratitudeEntry) {
                await api.put(`/api/journal/${gratitudeEntry.id}`, {
                    gratitudeTitle,
                    gratitudeContent,
                    gratitudeMood
                });
            } else {
                await api.post("/api/journal", {
                    type: "GRATITUDE",
                    date: dateStr,
                    gratitudeTitle,
                    gratitudeContent,
                    gratitudeMood
                });
            }

            await fetchEntries();
            toast({
                title: "Saved",
                description: "Gratitude entry saved",
                variant: "success"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save gratitude",
                variant: "destructive"
            });
        }
    }

    async function saveHealthEntry(category: "mental" | "physical" | "food") {
        const form = healthForms[category];
        if (!form.title.trim()) return;

        try {
            const dateStr = currentDate.toISOString().split('T')[0];
            const existingEntry = healthEntries[category];

            if (existingEntry) {
                await api.put(`/api/journal/${existingEntry.id}`, {
                    healthTitle: form.title,
                    healthContent: form.content,
                    healthRating: form.rating
                });
            } else {
                await api.post("/api/journal", {
                    type: "HEALTH",
                    date: dateStr,
                    healthCategory: category,
                    healthTitle: form.title,
                    healthContent: form.content,
                    healthRating: form.rating
                });
            }

            await fetchEntries();
            toast({
                title: "Saved",
                description: `${category.charAt(0).toUpperCase() + category.slice(1)} health entry saved`,
                variant: "success"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save health entry",
                variant: "destructive"
            });
        }
    }

    function changeDate(days: number) {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    }

    const isToday = currentDate.toDateString() === new Date().toDateString();
    const completedHabits = habitEntries.filter(h => h.habitCompleted).length;
    const totalHabits = habitEntries.length;
    const progressPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    const moods = [
        { emoji: "😊", label: "Happy", value: "happy" },
        { emoji: "😌", label: "Peaceful", value: "peaceful" },
        { emoji: "🎉", label: "Excited", value: "excited" },
        { emoji: "😔", label: "Sad", value: "sad" },
        { emoji: "😰", label: "Anxious", value: "anxious" },
        { emoji: "😴", label: "Tired", value: "tired" }
    ];

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight flex items-center gap-3">
                        <BookOpen className="w-10 h-10 text-blue-400" />
                        Journal
                    </h1>
                    <p className="text-muted mt-2">Track your habits, gratitude, and health daily</p>
                </div>

                {/* Date Navigator */}
                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => changeDate(-1)}
                        className="hover:bg-white/10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-center min-w-[200px]">
                        <p className="text-sm text-muted">
                            {isToday ? "Today" : currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                        <p className="text-lg font-bold">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => changeDate(1)}
                        disabled={isToday}
                        className="hover:bg-white/10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="habits" className="space-y-6">
                <TabsList className="bg-black/40 p-1 border border-white/10">
                    <TabsTrigger value="habits" className="data-[state=active]:bg-blue-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Habit Tracker
                    </TabsTrigger>
                    <TabsTrigger value="gratitude" className="data-[state=active]:bg-purple-600">
                        <Heart className="w-4 h-4 mr-2" />
                        Gratitude Journal
                    </TabsTrigger>
                    <TabsTrigger value="health" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-cyan-500">
                        <Activity className="w-4 h-4 mr-2" />
                        Health Journal
                    </TabsTrigger>
                </TabsList>

                {/* Habit Tracker */}
                <TabsContent value="habits" className="space-y-4">
                    <Card className="bg-black/40 border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Daily Habits</span>
                                {totalHabits > 0 && (
                                    <span className="text-sm font-normal text-muted">
                                        {completedHabits}/{totalHabits} completed ({progressPercent}%)
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Progress Bar */}
                            {totalHabits > 0 && (
                                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            )}

                            {/* Habit List */}
                            {loading ? (
                                <p className="text-center text-muted py-8">Loading...</p>
                            ) : habitEntries.length === 0 ? (
                                <p className="text-center text-muted py-8">No habits for this day. Add one to get started!</p>
                            ) : (
                                <div className="space-y-3">
                                    {habitEntries.map(entry => (
                                        <Card key={entry.id} className="bg-white/5 border-white/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={entry.habitCompleted}
                                                        onCheckedChange={() => toggleHabit(entry)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <p className={`font-medium ${entry.habitCompleted ? 'line-through text-muted' : ''}`}>
                                                            {entry.habitName}
                                                        </p>
                                                        <Textarea
                                                            placeholder="Add notes..."
                                                            value={entry.habitNotes || ""}
                                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateHabitNotes(entry, e.target.value)}
                                                            className="mt-2 bg-black/20 border-white/10 text-sm"
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteHabit(entry)}
                                                        className="hover:bg-red-500/20 hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Add Habit Form */}
                            {showHabitForm ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter habit name..."
                                        value={newHabitName}
                                        onChange={(e) => setNewHabitName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                                        className="bg-black/20 border-white/10"
                                        autoFocus
                                    />
                                    <Button onClick={addHabit} disabled={!newHabitName.trim()}>
                                        Add
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowHabitForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full border-dashed hover:bg-blue-500/10 hover:border-blue-500"
                                    onClick={() => setShowHabitForm(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New Habit
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Gratitude Journal */}
                <TabsContent value="gratitude">
                    <Card className="bg-black/40 border-white/10">
                        <CardHeader>
                            <CardTitle>What are you grateful for today?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <p className="text-center text-muted py-8">Loading...</p>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-sm text-muted mb-2 block">Title</label>
                                        <Input
                                            placeholder="e.g., Amazing day at work"
                                            value={gratitudeTitle}
                                            onChange={(e) => setGratitudeTitle(e.target.value)}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-muted mb-2 block">What happened?</label>
                                        <Textarea
                                            placeholder="Describe what you're grateful for..."
                                            value={gratitudeContent}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGratitudeContent(e.target.value)}
                                            className="bg-black/20 border-white/10 min-h-[150px]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-muted mb-2 block">How do you feel?</label>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                            {moods.map(mood => (
                                                <Button
                                                    key={mood.value}
                                                    variant={gratitudeMood === mood.value ? "default" : "outline"}
                                                    className={`flex flex-col items-center gap-1 h-auto py-3 ${gratitudeMood === mood.value
                                                        ? 'bg-purple-600 border-purple-600'
                                                        : 'hover:bg-white/10'
                                                        }`}
                                                    onClick={() => setGratitudeMood(mood.value)}
                                                >
                                                    <span className="text-2xl">{mood.emoji}</span>
                                                    <span className="text-xs">{mood.label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={saveGratitude}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        disabled={!gratitudeTitle.trim() && !gratitudeContent.trim()}
                                    >
                                        Save Entry
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Health Journal */}
                <TabsContent value="health">
                    <div className="space-y-4">
                        {(["mental", "physical", "food"] as const).map((category) => (
                            <Card key={category} className="bg-black border-0">
                                <CardHeader>
                                    <CardTitle className="capitalize flex items-center gap-2 text-white">
                                        <Activity className="w-5 h-5 text-green-400" />
                                        {category === 'food' ? 'Food Quality' : `${category} Health`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {loading ? (
                                        <p className="text-center text-muted py-4">Loading...</p>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="text-sm text-muted mb-2 block">Title</label>
                                                <Input
                                                    placeholder={`e.g., ${category === 'mental' ? 'Meditation session' : category === 'physical' ? 'Morning workout' : 'Healthy breakfast'}`}
                                                    value={healthForms[category].title}
                                                    onChange={(e) => setHealthForms(prev => ({
                                                        ...prev,
                                                        [category]: { ...prev[category], title: e.target.value }
                                                    }))}
                                                    className="bg-black/20 border-white/10"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm text-muted mb-2 block">Notes</label>
                                                <Textarea
                                                    placeholder="How did it go? Any observations?"
                                                    value={healthForms[category].content}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHealthForms(prev => ({
                                                        ...prev,
                                                        [category]: { ...prev[category], content: e.target.value }
                                                    }))}
                                                    className="bg-black/20 border-white/10 min-h-[100px]"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm text-muted mb-2 block">Rating</label>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                        const currentRating = healthForms[category].rating;
                                                        const hoverRating = starHover[category];
                                                        const isActive = star <= (hoverRating ?? currentRating);
                                                        
                                                        return (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onMouseEnter={() => setStarHover(prev => ({ ...prev, [category]: star }))}
                                                                onMouseLeave={() => setStarHover(prev => ({ ...prev, [category]: null }))}
                                                                onClick={() => setHealthForms(prev => ({
                                                                    ...prev,
                                                                    [category]: { ...prev[category], rating: star }
                                                                }))}
                                                                className="transition-all duration-200 hover:scale-125 active:scale-110"
                                                            >
                                                                <svg
                                                                    className={`w-10 h-10 transition-all duration-200 ${
                                                                        isActive 
                                                                            ? 'fill-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.9)]' 
                                                                            : 'fill-gray-700 hover:fill-gray-600'
                                                                    }`}
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                </svg>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => saveHealthEntry(category)}
                                                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 hover:from-green-600 hover:via-emerald-600 hover:to-cyan-600 shadow-lg shadow-green-500/30 transition-all duration-300 hover:shadow-green-500/50 hover:scale-[1.02]"
                                                disabled={!healthForms[category].title.trim()}
                                            >
                                                Save {category.charAt(0).toUpperCase() + category.slice(1)} Entry
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
