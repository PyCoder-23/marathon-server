"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Trash2, Plus, ListTodo } from "lucide-react";
import { api } from "@/lib/api-client";

interface Task {
    id: string;
    title: string;
    completed: boolean;
    order: number;
}

export function TodoList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    async function fetchTasks() {
        try {
            const data = await api.get("/api/tasks");
            setTasks(data.tasks);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    }

    async function addTask(e: React.FormEvent) {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            const data = await api.post("/api/tasks", { title: newTask });
            setTasks([...tasks, data.task].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)));
            setNewTask("");
        } catch (error) {
            console.error("Failed to add task", error);
        }
    }

    async function toggleTask(task: Task) {
        try {
            // Optimistic update
            const updated = { ...task, completed: !task.completed };
            setTasks(tasks.map(t => t.id === task.id ? updated : t)
                .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))); // Re-sort

            await api.put(`/api/tasks/${task.id}`, {
                title: task.title,
                completed: !task.completed,
                order: task.order
            });
        } catch (error) {
            console.error("Failed to update task", error);
            fetchTasks(); // Revert
        }
    }

    async function deleteTask(id: string) {
        if (!confirm("Delete task?")) return;
        try {
            setTasks(tasks.filter(t => t.id !== id));
            await api.delete(`/api/tasks/${id}`);
        } catch (error) {
            console.error("Failed to delete task", error);
            fetchTasks(); // Revert
        }
    }

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <ListTodo className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-white">To-Do List</h3>
            </div>

            <form onSubmit={addTask} className="flex gap-2 mb-6">
                <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task..."
                    className="bg-black/50 border-white/10"
                />
                <Button type="submit" size="icon" className="bg-primary text-black hover:bg-primary/80">
                    <Plus className="w-5 h-5" />
                </Button>
            </form>

            <div className="space-y-2">
                {loading ? (
                    <div className="text-center text-muted text-sm py-4">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center text-muted/50 text-sm py-8 italic">No tasks yet. Stay productive!</div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`group flex items-center justify-between p-3 rounded-lg border transition-all
                                ${task.completed ? "bg-white/[0.02] border-transparent opacity-50" : "bg-white/5 border-white/5 hover:border-white/10"}
                            `}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={() => toggleTask(task)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all
                                        ${task.completed ? "bg-primary border-primary text-black" : "border-white/30 hover:border-white"}
                                    `}
                                >
                                    {task.completed && <Check className="w-3.5 h-3.5" />}
                                </button>
                                <span className={`text-sm ${task.completed ? "line-through text-muted" : "text-white"}`}>
                                    {task.title}
                                </span>
                            </div>

                            <button
                                onClick={() => deleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
