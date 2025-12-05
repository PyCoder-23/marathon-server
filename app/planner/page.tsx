"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { CalendarHeader } from "@/components/planner/calendar-header";
import { MonthView } from "@/components/planner/month-view";
import { WeekView } from "@/components/planner/week-view";
import { DayView } from "@/components/planner/day-view";
import { EventModal } from "@/components/planner/event-modal";
import { TodoList } from "@/components/planner/todo-list";
import { useAuth } from "@/lib/auth-context";

interface PlannerEvent {
    id: string;
    title: string;
    description?: string;
    start: string | Date;
    end: string | Date;
    color?: string;
    allDay?: boolean;
}

import { Button } from "@/components/ui/button";

export default function PlannerPage() {
    const { user } = useAuth();
    const [view, setView] = useState<"month" | "week" | "day">("month");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<PlannerEvent[]>([]);

    // To-Do Logic
    const [showTodoList, setShowTodoList] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | undefined>(undefined);
    const [clickedSlot, setClickedSlot] = useState<Date | undefined>(undefined);

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user, currentDate, view]); // Re-fetch on view/date change

    const fetchEvents = async () => {
        // Calculate range based on view
        // For simplicity, we fetch a broad range (Month +/- 1 week padding)
        // Or if simple, just fetch "current Month" in month view.

        // Optimally: Get Start and End of the VISIBLE grid.
        let start = startOfMonth(currentDate);
        let end = endOfMonth(currentDate);

        if (view === "week") {
            start = startOfWeek(currentDate);
            end = endOfWeek(currentDate);
        } else if (view === "day") {
            start = currentDate; // Approx
            end = currentDate;
        }

        // Add padding to ensure fetching full weeks in month view
        start = startOfWeek(start);
        end = endOfWeek(end);

        try {
            const query = new URLSearchParams({
                start: start.toISOString(),
                end: end.toISOString()
            });
            const data = await api.get(`/api/events?${query.toString()}`);
            setEvents(data.events);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const handleSaveEvent = async (eventData: any) => {
        try {
            if (eventData.id) {
                await api.put(`/api/events/${eventData.id}`, eventData);
            } else {
                await api.post("/api/events", eventData);
            }
            fetchEvents(); // Refresh
        } catch (error) {
            console.error("Failed to save event", error);
            alert("Failed to save event.");
        }
    };

    const handleDeleteEvent = async (id: string) => {
        try {
            await api.delete(`/api/events/${id}`);
            fetchEvents(); // Refresh
        } catch (error) {
            console.error("Failed to delete event", error);
            alert("Failed to delete event.");
        }
    };

    const openAddModal = (date?: Date) => {
        setSelectedEvent(undefined);
        setClickedSlot(date);
        setIsModalOpen(true);
    };

    const openEditModal = (event: PlannerEvent) => {
        setSelectedEvent(event);
        setClickedSlot(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto max-w-7xl p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
            {/* Calendar Section */}
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-h-[700px] flex flex-col">
                <CalendarHeader
                    currentDate={currentDate}
                    view={view}
                    onDateChange={setCurrentDate}
                    onViewChange={setView}
                    onAddEvent={() => openAddModal()}
                />

                <div className="flex-1 relative">
                    {view === "month" && (
                        <MonthView
                            currentDate={currentDate}
                            events={events}
                            onEventClick={openEditModal}
                            onSlotClick={openAddModal}
                        />
                    )}
                    {view === "week" && (
                        <WeekView
                            currentDate={currentDate}
                            events={events}
                            onEventClick={openEditModal}
                            onSlotClick={openAddModal}
                        />
                    )}
                    {view === "day" && (
                        <DayView
                            currentDate={currentDate}
                            events={events}
                            onEventClick={openEditModal}
                            onSlotClick={openAddModal}
                        />
                    )}
                </div>
            </div>

            {/* To-Do List Toggle Section */}
            <div className="max-w-3xl mx-auto">
                {!showTodoList ? (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            className="text-muted hover:text-white border-white/10 hover:border-white/30 transition-all font-mono text-xs tracking-wider uppercase"
                            onClick={() => setShowTodoList(true)}
                        >
                            All of this looks too complex?? Use a simple to-do list here
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted hover:text-white"
                                onClick={() => setShowTodoList(false)}
                            >
                                Hide To-Do List
                            </Button>
                        </div>
                        <TodoList />
                    </div>
                )}
            </div>

            {/* Event Modal */}
            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                event={selectedEvent}
                initialDate={clickedSlot}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
            />
        </div>
    );
}
