"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-context";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, ImageIcon, Save, Loader2, Lock, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        image: "",
        currentPassword: "",
        isProfileLocked: false
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || "",
                email: user.email || "",
                image: user.image || "",
                currentPassword: "",
                isProfileLocked: user.isProfileLocked || false
            });
        }
    }, [user]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/api/users/update", formData);
            await refreshUser();
            toast({
                title: "Profile updated",
                description: "Your changes have been saved successfully.",
                variant: "success"
            });
            setFormData(prev => ({ ...prev, currentPassword: "" }));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
                <p className="text-muted">Manage your profile and preferences.</p>
            </div>

            <Card className="border-white/10 bg-black/40">
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        Update your public profile details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="pl-9"
                                    placeholder="Your username"
                                />
                            </div>
                            <p className="text-xs text-muted">This is your public display name.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-9"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">Profile Picture</Label>
                            <div className="space-y-4">
                                {/* Preview */}
                                {formData.image && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
                                            <img
                                                src={formData.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-sm text-muted">
                                            Current profile picture
                                        </div>
                                    </div>
                                )}

                                {/* Option 1: Default Random PFP */}
                                <div className="p-4 border border-white/10 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium">Default Avatar</h4>
                                            <p className="text-xs text-muted">Get a random default profile picture</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const randomNum = Math.floor(Math.random() * 10) + 1;
                                                setFormData({ ...formData, image: `/pfps/pfp${randomNum}.png` });
                                            }}
                                        >
                                            Use Default
                                        </Button>
                                    </div>
                                </div>

                                {/* Option 2: URL Input */}
                                <div className="p-4 border border-white/10 rounded-lg space-y-2">
                                    <h4 className="text-sm font-medium">Image URL</h4>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="image"
                                            value={formData.image}
                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                            className="pl-9"
                                            placeholder="https://example.com/avatar.jpg"
                                        />
                                    </div>
                                </div>

                                {/* Option 3: File Upload */}
                                <div className="p-4 border border-white/10 rounded-lg space-y-2">
                                    <h4 className="text-sm font-medium">Upload Image</h4>
                                    <Input
                                        id="imageFile"
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                // Convert to base64
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setFormData({ ...formData, image: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="cursor-pointer"
                                    />
                                    <p className="text-xs text-muted">Upload an image file (JPG, PNG, GIF)</p>
                                </div>
                            </div>
                        </div>

                        {/* Password Verification for Sensitive Changes */}
                        <div className="space-y-2 pt-4 border-t border-white/10">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    className="pl-9"
                                    placeholder="Required if changing username or email"
                                />
                            </div>
                            <p className="text-xs text-muted">Include this to verify changes to sensitive information.</p>
                        </div>

                        {/* Privacy Settings */}
                        <div className="p-4 border border-white/10 rounded-lg space-y-4 bg-white/5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Lock Profile</Label>
                                    <p className="text-xs text-muted">
                                        Hide your stats and activity from other users.
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        type="button"
                                        variant={formData.isProfileLocked ? "destructive" : "outline"}
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, isProfileLocked: !formData.isProfileLocked })}
                                    >
                                        {formData.isProfileLocked ? (
                                            <>
                                                <Lock className="w-3 h-3 mr-2" />
                                                Locked
                                            </>
                                        ) : (
                                            "Unlocked"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/40">
                <CardHeader>
                    <CardTitle>Appearance & Customization</CardTitle>
                    <CardDescription>Customize your profile and cosmetics.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                        <div className="space-y-1">
                            <h4 className="font-medium text-white">Profile Cosmetics</h4>
                            <p className="text-xs text-muted">Equip frames, nameplates, and banners from your inventory.</p>
                        </div>
                        <Link href="/shop">
                            <Button variant="secondary">Go to Marketplace</Button>
                        </Link>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Streak Freezes</h4>
                                <p className="text-xs text-muted">You have <span className="text-white font-mono font-bold">{user?.streakFreezes || 0}</span> freezes available.</p>
                            </div>
                        </div>
                        <Link href="/shop">
                            <Button variant="outline" size="sm">Get More</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <SecuritySection />
        </div>
    );
}

function SecuritySection() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    });

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            await api.post("/api/auth/change-password", {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            toast({ title: "Password Updated", description: "Your password has been changed successfully.", variant: "success" });
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to change password", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="border-white/10 bg-black/40">
            <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and account security.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sec-current">Current Password</Label>
                        <Input
                            id="sec-current"
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sec-new">New Password</Label>
                        <Input
                            id="sec-new"
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sec-confirm">Confirm New Password</Label>
                        <Input
                            id="sec-confirm"
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <a href="/forgot-password" className="text-sm text-primary hover:underline">
                            Forgot Password?
                        </a>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Updating..." : "Update Password"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
