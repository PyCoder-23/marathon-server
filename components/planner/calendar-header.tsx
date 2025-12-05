"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, LayoutGrid, List } from "lucide-react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";

interface CalendarHeaderProps {
    currentDate: Date;
    view: "month" | "week" | "day";
    onDateChange: (date: Date) => void;
    onViewChange: (view: "month" | "week" | "day") => void;
    onAddEvent: () => void;
}

export function CalendarHeader({ currentDate, view, onDateChange, onViewChange, onAddEvent }: CalendarHeaderProps) {
    const handlePrev = () => {
        if (view === "month") onDateChange(subMonths(currentDate, 1));
        if (view === "week") onDateChange(subWeeks(currentDate, 1));
        if (view === "day") onDateChange(subDays(currentDate, 1));
    };

    const handleNext = () => {
        if (view === "month") onDateChange(addMonths(currentDate, 1));
        if (view === "week") onDateChange(addWeeks(currentDate, 1));
        if (view === "day") onDateChange(addDays(currentDate, 1));
    };

    const handleToday = () => onDateChange(new Date());

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b border-white/10 bg-black/40 sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handlePrev}>
                        <ChevronLeft className="w-5 h-5 text-muted" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleNext}>
                        <ChevronRight className="w-5 h-5 text-muted" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday} className="ml-2">
                        Today
                    </Button>
                </div>
                <h2 className="text-xl font-bold font-mono text-white">
                    {format(currentDate, view === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
                </h2>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => onViewChange("month")}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${view === "month" ? "bg-primary text-black font-bold" : "text-muted hover:text-white"}`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => onViewChange("week")}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${view === "week" ? "bg-primary text-black font-bold" : "text-muted hover:text-white"}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => onViewChange("day")}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${view === "day" ? "bg-primary text-black font-bold" : "text-muted hover:text-white"}`}
                    >
                        Day
                    </button>
                </div>

                <Button className="ml-auto shadow-[0_0_15px_rgba(0,255,149,0.3)]" onClick={onAddEvent}>
                    <Plus className="w-4 h-4 mr-2" />
                    Event
                </Button>
            </div>
        </div>
    );
}
