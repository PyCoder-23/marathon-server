"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event?: any; // If editing
    initialDate?: Date; // If creating from slot
    onSave: (data: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export function EventModal({ isOpen, onClose, event, initialDate, onSave, onDelete }: EventModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [color, setColor] = useState("#22c55e"); // Default Green

    useEffect(() => {
        if (isOpen) {
            if (event) {
                setTitle(event.title);
                setDescription(event.description || "");
                setStart(format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"));
                setEnd(format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"));
                setColor(event.color || "#22c55e");
            } else {
                // Default new event
                const baseDate = initialDate || new Date();
                // Round to nearest hour
                baseDate.setMinutes(0, 0, 0);
                const endDate = new Date(baseDate);
                endDate.setHours(baseDate.getHours() + 1);

                setTitle("");
                setDescription("");
                setStart(format(baseDate, "yyyy-MM-dd'T'HH:mm"));
                setEnd(format(endDate, "yyyy-MM-dd'T'HH:mm"));
                setColor("#22c55e");
            }
        }
    }, [isOpen, event, initialDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            id: event?.id,
            title,
            description,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            color
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>{event ? "Edit Event" : "Add Event"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Study Session"
                            required
                            className="bg-black/50 border-white/10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Details..."
                            className="bg-black/50 border-white/10"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start</Label>
                            <Input
                                type="datetime-local"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                required
                                className="bg-black/50 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End</Label>
                            <Input
                                type="datetime-local"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                required
                                className="bg-black/50 border-white/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                            {["#22c55e", "#3b82f6", "#ef4444", "#eab308", "#a855f7"].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent opacity-70'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between items-center mt-6">
                        {event && onDelete ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                    if (confirm("Delete this event?")) {
                                        onDelete(event.id);
                                        onClose();
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        ) : <div />}

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" className="bg-primary text-black hover:bg-primary/90">Save</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
