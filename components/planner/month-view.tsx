"use client";

import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, format, isSameMonth, isSameDay,
    isToday
} from "date-fns";

interface PlannerEvent {
    id: string;
    title: string;
    start: string | Date;
    end: string | Date;
    color?: string;
    allDay?: boolean;
}

interface MonthViewProps {
    currentDate: Date;
    events: PlannerEvent[];
    onEventClick: (event: PlannerEvent) => void;
    onSlotClick: (date: Date) => void;
}

export function MonthView({ currentDate, events, onEventClick, onSlotClick }: MonthViewProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="flex flex-col h-full bg-black/40">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
                {weekDays.map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-bold text-muted uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {days.map((day) => {
                    const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={day.toString()}
                            className={`min-h-[100px] border-b border-r border-white/5 p-1 transition-colors hover:bg-white/5 cursor-pointer relative group
                                ${!isCurrentMonth ? "bg-white/[0.02] text-muted/50" : "text-white"}
                            `}
                            onClick={() => onSlotClick(day)}
                        >
                            <span className={`text-sm font-mono p-1 rounded-full w-7 h-7 flex items-center justify-center
                                ${isToday(day) ? "bg-primary text-black font-bold shadow-[0_0_10px_rgba(0,255,149,0.5)]" : ""}
                            `}>
                                {format(day, "d")}
                            </span>

                            <div className="mt-1 space-y-1">
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        className="text-xs truncate px-1.5 py-0.5 rounded shadow-sm border border-transparent hover:border-white/20 transition-all cursor-pointer"
                                        style={{
                                            backgroundColor: (event.color || "#22c55e") + "40", // 25% opacity
                                            borderLeft: `2px solid ${event.color || "#22c55e"}`,
                                            color: "white"
                                        }}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                            </div>

                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs text-primary/50 pointer-events-none">
                                +
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
