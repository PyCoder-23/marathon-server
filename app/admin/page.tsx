"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreHorizontal, Shield, ShieldAlert, Ban, Trash2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast-context";
import { useAuth } from "@/lib/auth-context";

interface User {
    id: string;
    username: string;
    email: string;
    image?: string | null;
    isAdmin: boolean;
    totalXp: number;
    totalMinutes: number;
    streakDays: number;
    bannedUntil: string | null;
    squad: { id: string; name: string } | null;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { toast } = useToast();
    const { user, refreshUser } = useAuth();

    // Edit State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [squads, setSquads] = useState<{ id: string; name: string }[]>([]);
    const [editXp, setEditXp] = useState(0);
    const [editMinutes, setEditMinutes] = useState(0);
    const [editSquadId, setEditSquadId] = useState<string>("");

    useEffect(() => {
        fetchSquads();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page]);

    async function fetchSquads() {
        try {
            const data = await api.get("/api/squads"); // Assuming this endpoint exists and returns { squads: [] }
            setSquads(data.squads);
        } catch (error) {
            console.error("Failed to fetch squads:", error);
        }
    }

    async function fetchUsers() {
        setLoading(true);
        try {
            const data = await api.get(`/api/admin/users/list?q=${search}&page=${page}`);
            setUsers(data.users);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleBan(userId: string) {
        if (!confirm("Are you sure you want to ban this user for 7 days?")) return;
        try {
            await api.post("/api/admin/users/ban", { userId, durationDays: 7, reason: "Admin action" });
            toast({ title: "User banned", description: "User has been banned for 7 days." });
            fetchUsers();
        } catch (error) {
            toast({ title: "Error", description: "Failed to ban user.", variant: "destructive" });
        }
    }

    async function handleDelete(userId: string) {
        if (!confirm("Are you sure? This action is IRREVERSIBLE.")) return;
        try {
            await api.post("/api/admin/users/delete", { userId });
            toast({ title: "User deleted", description: "User account has been permanently removed." });
            fetchUsers();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
        }
    }

    async function handleUpdateUser() {
        if (!editingUser) return;
        try {
            await api.post("/api/admin/users/update", {
                userId: editingUser.id,
                totalXp: editXp,
                totalMinutes: editMinutes,
                squadId: editSquadId
            });
            toast({ title: "User updated", description: "User stats have been updated." });

            // Refresh global user state if updating self
            if (user && editingUser.id === user.id) {
                await refreshUser();
            }

            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Admin Command</h1>
                    <p className="text-muted">Manage users and enforcement.</p>
                </div>
            </div>

            <Card className="border-white/10 bg-black/40">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Users</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/10">
                                <TableHead>User</TableHead>
                                <TableHead>Squad</TableHead>
                                <TableHead>Stats</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted">Loading...</TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted">No users found.</TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                                                    {user.image ? (
                                                        <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white flex items-center gap-2">
                                                        {user.username}
                                                        {user.isAdmin && <Shield className="w-3 h-3 text-yellow-500" />}
                                                    </span>
                                                    <span className="text-xs text-muted">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.squad ? (
                                                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                                                    {user.squad.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p><span className="text-muted">XP:</span> {user.totalXp}</p>
                                                <p><span className="text-muted">Time:</span> {Math.floor(user.totalMinutes / 60)}h</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.bannedUntil && new Date(user.bannedUntil) > new Date() ? (
                                                <Badge variant="destructive">Banned</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-black border-white/10 text-white">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setEditXp(user.totalXp);
                                                            setEditMinutes(user.totalMinutes);
                                                            setEditSquadId(user.squad?.id || "");
                                                        }}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Stats
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleBan(user.id)}>
                                                        <Ban className="mr-2 h-4 w-4" /> Ban User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(user.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="bg-black border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
                        <DialogDescription>
                            Manually adjust user statistics.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="xp" className="text-right text-sm">Total XP</label>
                            <Input
                                id="xp"
                                type="number"
                                value={editXp}
                                onChange={(e) => setEditXp(parseInt(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="minutes" className="text-right text-sm">Total Minutes</label>
                            <Input
                                id="minutes"
                                type="number"
                                value={editMinutes}
                                onChange={(e) => setEditMinutes(parseInt(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="squad" className="text-right text-sm">Squad</label>
                            <div className="col-span-3">
                                <Select value={editSquadId} onValueChange={setEditSquadId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a squad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {squads.map((squad) => (
                                            <SelectItem key={squad.id} value={squad.id}>
                                                {squad.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                        <Button onClick={handleUpdateUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
