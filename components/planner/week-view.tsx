"use client";

import {
    startOfWeek, addDays, format, isSameDay,
    differenceInMinutes
} from "date-fns";

interface PlannerEvent {
    id: string;
    title: string;
    start: string | Date;
    end: string | Date;
    color?: string;
    allDay?: boolean;
}

interface WeekViewProps {
    currentDate: Date;
    events: PlannerEvent[];
    onEventClick: (event: PlannerEvent) => void;
    onSlotClick: (date: Date) => void;
}

export function WeekView({ currentDate, events, onEventClick, onSlotClick }: WeekViewProps) {
    const startDate = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 24 }).map((_, i) => i);

    return (
        <div className="flex flex-col h-[600px] overflow-y-auto bg-black/40 custom-scrollbar border-b border-white/10">
            {/* Header Row */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-black/90 border-b border-white/10">
                <div className="p-2 border-r border-white/10"></div>
                {weekDays.map((day) => (
                    <div
                        key={day.toString()}
                        className={`p-2 text-center text-sm font-mono border-r border-white/10 ${isSameDay(day, new Date()) ? "text-primary font-bold" : "text-muted"}`}
                    >
                        <div className="text-xs uppercase opacity-70">{format(day, "EEE")}</div>
                        <div className="text-lg">{format(day, "d")}</div>
                    </div>
                ))}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
                {/* Time Labels */}
                <div className="border-r border-white/10">
                    {hours.map((hour) => (
                        <div key={hour} className="h-16 border-b border-white/5 text-xs text-muted/50 p-1 text-right pr-2">
                            {format(new Date().setHours(hour, 0), "h a")}
                        </div>
                    ))}
                </div>

                {/* Day Columns */}
                {weekDays.map((day) => (
                    <div key={day.toString()} className="border-r border-white/10 relative min-h-[1536px]"> {/* 16px * 24 is too small. 64px * 24 = 1536px */}
                        {/* Grid Lines */}
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="h-16 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                                onClick={() => {
                                    const clickDate = new Date(day);
                                    clickDate.setHours(hour);
                                    onSlotClick(clickDate);
                                }}
                            />
                        ))}

                        {/* Events */}
                        {events
                            .filter(e => isSameDay(new Date(e.start), day))
                            .map(event => {
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
                                        className="absolute left-1 right-1 rounded px-2 py-1 text-xs overflow-hidden cursor-pointer hover:brightness-110 hover:z-20 shadow-md border-l-4 transition-all"
                                        style={{
                                            top: `${(startMinutes / 1440) * 100}%`,
                                            height: `${Math.max((duration / 1440) * 100, 2)}%`, // Min height 2% ~ 30min slot
                                            backgroundColor: (event.color || "#22c55e") + "60",
                                            borderColor: event.color || "#22c55e",
                                            color: "white"
                                        }}
                                    >
                                        <div className="font-bold truncate">{event.title}</div>
                                        {duration > 45 && <div className="truncate opacity-75">{format(start, "h:mm a")} - {format(end, "h:mm a")}</div>}
                                    </div>
                                );
                            })
                        }
                    </div>
                ))}
            </div>
        </div>
    );
}
