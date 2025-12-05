"use client";

import {
    format,
    differenceInMinutes,
    isSameDay
} from "date-fns";
import { Clock } from "lucide-react";

interface PlannerEvent {
    id: string;
    title: string;
    description?: string;
    start: string | Date;
    end: string | Date;
    color?: string;
    allDay?: boolean;
}

interface DayViewProps {
    currentDate: Date;
    events: PlannerEvent[];
    onEventClick: (event: PlannerEvent) => void;
    onSlotClick: (date: Date) => void;
}

export function DayView({ currentDate, events, onEventClick, onSlotClick }: DayViewProps) {
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const dayEvents = events.filter(e => isSameDay(new Date(e.start), currentDate));

    return (
        <div className="flex flex-col h-[600px] overflow-y-auto bg-black/40 custom-scrollbar border-b border-white/10">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/95 p-4 border-b border-white/10 flex items-center gap-4">
                <div className="text-4xl font-bold text-primary shadow-[0_0_15px_rgba(0,255,149,0.3)]">
                    {format(currentDate, "d")}
                </div>
                <div>
                    <div className="text-xl font-bold text-white">{format(currentDate, "EEEE")}</div>
                    <div className="text-muted">{dayEvents.length} events scheduled</div>
                </div>
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-[80px_1fr] relative">
                {/* Labels */}
                <div className="border-r border-white/10">
                    {hours.map((hour) => (
                        <div key={hour} className="h-20 border-b border-white/5 text-sm text-muted/50 p-2 text-right">
                            {format(new Date().setHours(hour, 0), "h a")}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative min-h-[1920px]"> {/* 80px * 24 */}
                    {/* Grid Lines */}
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className="h-20 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer relative group"
                            onClick={() => {
                                const clickDate = new Date(currentDate);
                                clickDate.setHours(hour);
                                onSlotClick(clickDate);
                            }}
                        >
                            <span className="absolute left-2 top-2 opacity-0 group-hover:opacity-50 text-xs text-primary">+ Add Event</span>
                        </div>
                    ))}

                    {/* Events */}
                    {dayEvents.map(event => {
                        const start = new Date(event.start);
                        const end = new Date(event.end);
                        const startMinutes = start.getHours() * 60 + start.getMinutes();
                        const duration = differenceInMinutes(end, start);

                        return (
                            <div
                                key={event.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick(event);
                                }}
                                className="absolute left-2 right-2 rounded-lg p-3 cursor-pointer hover:brightness-110 hover:shadow-lg transition-all border-l-4 overflow-hidden"
                                style={{
                                    top: `${(startMinutes / 1440) * 100}%`,
                                    height: `${Math.max((duration / 1440) * 100, 4)}%`, // Minimum height enforced
                                    backgroundColor: (event.color || "#22c55e") + "30",
                                    borderColor: event.color || "#22c55e",
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="font-bold text-white text-base">{event.title}</div>
                                    <div className="flex items-center text-xs text-white/70 bg-black/30 px-2 py-1 rounded">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {format(start, "h:mm a")} - {format(end, "h:mm a")}
                                    </div>
                                </div>
                                {event.description && (
                                    <div className="text-sm text-white/60 mt-1 line-clamp-2">
                                        {event.description}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
