"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, User, Shield, Settings, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Missions", href: "/missions" },
    { name: "Journal", href: "/journal" },
    { name: "Planner", href: "/planner" },
    { name: "Squads", href: "/squads" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Hall of Fame", href: "/hall-of-fame" },
];

export function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { user, loading, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-10 h-10 rounded overflow-hidden border border-primary/50 group-hover:shadow-[0_0_15px_rgba(0,255,149,0.5)] transition-all">
                        <img src="/logo.jpg" alt="Marathon Logo" className="object-cover w-full h-full" />
                    </div>
                    <span className="font-orbitron font-bold text-xl tracking-wider text-white group-hover:text-primary transition-colors">
                        MARATHON
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === item.href ? "text-primary" : "text-muted"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-4 hover:bg-white/5 h-auto py-2">
                                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center relative shrink-0 overflow-visible", user.equippedFrame)}>
                                            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center overflow-hidden bg-black">
                                                {user.image ? (
                                                    <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start text-xs">
                                            <span className={`font-medium ${user.equippedNameplate || 'text-white'}`}>{user.username}</span>
                                            <span className="text-primary font-mono">{user.totalXp} XP</span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-black border-white/10 text-white">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <Link href={`/profile/${user.username}`}>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href="/settings">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href="/shop">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <ShoppingBag className="mr-2 h-4 w-4 text-purple-400" />
                                            <span>Shop</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    {user.isAdmin && (
                                        <Link href="/admin">
                                            <DropdownMenuItem className="cursor-pointer">
                                                <Shield className="mr-2 h-4 w-4 text-yellow-500" />
                                                <span>Admin Command</span>
                                            </DropdownMenuItem>
                                        </Link>
                                    )}
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={() => logout()}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="text-muted hover:text-white">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm" className="shadow-[0_0_10px_rgba(0,255,149,0.3)]">
                                    Join Camp
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl absolute w-full">
                    <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "text-base font-medium py-2 transition-colors hover:text-primary",
                                    pathname === item.href ? "text-primary" : "text-muted"
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="h-px bg-white/10 my-2" />
                        {user ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <User className="w-4 h-4 text-primary" />
                                    <span className="text-white font-medium">{user.username}</span>
                                    <span className="text-muted">•</span>
                                    <span className="text-primary font-mono">{user.totalXp} XP</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        logout();
                                        setIsOpen(false);
                                    }}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link href="/login" onClick={() => setIsOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/signup" onClick={() => setIsOpen(false)}>
                                    <Button className="w-full">Join Camp</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
