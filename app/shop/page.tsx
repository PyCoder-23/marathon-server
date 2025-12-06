"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Sparkles, User, ShoppingBag, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-context";
import Image from "next/image";

interface ShopItem {
    id: string;
    name: string;
    description: string;
    type: string;
    price: number;
    assetUrl: string | null;
    cssClass: string | null;
    isAnimated: boolean;
    owned: boolean;
}

export default function ShopPage() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    useEffect(() => {
        fetchItems();
    }, [user?.coins]); // Re-fetch if coins change (optimistic update can also work)

    async function fetchItems() {
        try {
            const data = await api.get("/api/shop/items");
            setItems(data.items);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleBuy(item: ShopItem) {
        if (!user || (user.coins || 0) < item.price) return;
        setPurchasing(item.id);

        try {
            await api.post("/api/shop/buy", { itemId: item.id });
            // Refresh logic
            await refreshUser(); // Updates coin balance
            await fetchItems(); // Updates 'owned' status

            toast({
                title: "Purchase Successful",
                description: `You bought ${item.name}!`,
                variant: "success"
            });
        } catch (error: any) {
            toast({
                title: "Purchase Failed",
                description: error.message || "Could not complete purchase",
                variant: "destructive"
            });
        } finally {
            setPurchasing(null);
        }
    }

    async function handleEquip(item: ShopItem) {
        try {
            await api.post("/api/shop/equip", { itemId: item.id });
            await refreshUser();
            toast({
                title: "Equipped",
                description: `${item.name} is now active.`,
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to equip item.",
                variant: "destructive"
            });
        }
    }

    async function handleUnequip(type: string) {
        try {
            await api.post("/api/shop/equip", { unequipType: type });
            await refreshUser();
            toast({
                title: "Unequipped",
                description: `Restored default ${type.toLowerCase()}.`,
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to unequip.",
                variant: "destructive"
            });
        }
    }

    const frames = items.filter(i => i.type === "FRAME");
    const nameplates = items.filter(i => i.type === "NAMEPLATE");
    const banners = items.filter(i => i.type === "BANNER");
    const consumables = items.filter(i => i.type === "FREEZE");

    if (loading) {
        return <div className="p-10 text-center">Loading Marketplace...</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-tight flex items-center gap-3">
                        <ShoppingBag className="w-10 h-10 text-purple-400" />
                        Cyber Bazaar
                    </h1>
                    <p className="text-muted mt-2">Spend your hard-earned coins on exclusive digital cosmetics.</p>
                </div>

                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <div className="text-right">
                        <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Balance</p>
                        <p className="text-3xl font-mono font-bold text-white flex items-center gap-2">
                            {user?.coins || 0}
                            <Coins className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="cosmetics" className="space-y-6">
                <TabsList className="bg-black/40 p-1 border border-white/10">
                    <TabsTrigger value="cosmetics" className="data-[state=active]:bg-purple-600">Cosmetics</TabsTrigger>
                    <TabsTrigger value="consumables" className="data-[state=active]:bg-blue-600">Power-ups</TabsTrigger>
                </TabsList>

                <TabsContent value="cosmetics" className="space-y-10">

                    {/* Frames Section */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <User className="w-6 h-6 text-purple-400" /> Profile Frames
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {/* Default Option */}
                            <Card className="bg-black/40 border-white/5 hover:border-white/20 transition-all border-dashed">
                                <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
                                    <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center bg-zinc-900">
                                        <span className="text-xs text-muted">None</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-sm">Default</h3>
                                        <p className="text-xs text-muted mb-4">No frame equipped</p>
                                        <Button
                                            variant="secondary"
                                            className="w-full h-8 text-xs"
                                            disabled={!user?.equippedFrame}
                                            onClick={() => handleUnequip("FRAME")}
                                        >
                                            {user?.equippedFrame ? "Unequip" : "Active"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                            {frames.map(item => <ShopCard key={item.id} item={item} user={user} onBuy={handleBuy} onEquip={handleEquip} purchasing={purchasing} />)}
                        </div>
                    </section>

                    {/* Nameplates Section */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-pink-400" /> Nameplates
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {/* Default Option */}
                            <Card className="bg-black/40 border-white/5 hover:border-white/20 transition-all border-dashed">
                                <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
                                    <div className="text-lg font-bold px-3 py-1 text-white bg-black/20 rounded">
                                        {user?.username || 'User'}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-sm">Default</h3>
                                        <p className="text-xs text-muted mb-4">Standard text</p>
                                        <Button
                                            variant="secondary"
                                            className="w-full h-8 text-xs"
                                            disabled={!user?.equippedNameplate}
                                            onClick={() => handleUnequip("NAMEPLATE")}
                                        >
                                            {user?.equippedNameplate ? "Unequip" : "Active"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                            {nameplates.map(item => <ShopCard key={item.id} item={item} user={user} onBuy={handleBuy} onEquip={handleEquip} purchasing={purchasing} />)}
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="consumables">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-blue-400" /> Survival Gear
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {consumables.map(item => <ShopCard key={item.id} item={item} user={user} onBuy={handleBuy} onEquip={() => { }} purchasing={purchasing} isConsumable />)}
                        </div>
                    </section>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ShopCard({ item, user, onBuy, onEquip, purchasing, isConsumable = false }: any) {
    const canAfford = (user?.coins || 0) >= item.price;
    const isOwned = item.owned;
    const isEquipped =
        (item.type === 'FRAME' && user?.equippedFrame === item.cssClass) ||
        (item.type === 'NAMEPLATE' && user?.equippedNameplate === item.cssClass);

    return (
        <Card className={`bg-black/40 border-white/5 hover:border-purple-500/50 transition-all group overflow-hidden ${isOwned ? 'border-purple-500/30' : ''}`}>
            <div className="h-32 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent relative p-4">
                {/* Preview Logic */}
                {item.type === 'FRAME' && (
                    <div className={`relative w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center ${item.cssClass || ''}`}>
                        <div className="w-16 h-16 rounded-full bg-zinc-800" />
                    </div>
                )}
                {item.type === 'NAMEPLATE' && (
                    <div className={`text-lg font-bold px-3 py-1 ${item.cssClass || ''}`}>
                        {user?.username || 'Username'}
                    </div>
                )}
                {item.type === 'FREEZE' && (
                    <ShieldCheck className="w-16 h-16 text-blue-400 opacity-80" />
                )}
            </div>

            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
                    {!isOwned && !isConsumable && <span className="text-xs font-mono text-yellow-500">{item.price} C</span>}
                    {/* For consumables, always show price */}
                    {isConsumable && <span className="text-xs font-mono text-yellow-500">{item.price} C</span>}
                </div>
                <p className="text-xs text-muted h-8 line-clamp-2">{item.description}</p>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                {isOwned && !isConsumable ? (
                    <Button
                        variant={isEquipped ? "secondary" : "default"}
                        className="w-full h-8 text-xs"
                        disabled={isEquipped}
                        onClick={() => onEquip(item)}
                    >
                        {isEquipped ? "Equipped" : "Equip"}
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className={`w-full h-8 text-xs ${!canAfford ? 'opacity-50' : 'hover:bg-purple-600 hover:text-white hover:border-purple-600'}`}
                        disabled={!canAfford || purchasing === item.id}
                        onClick={() => onBuy(item)}
                    >
                        {purchasing === item.id ? "Buying..." : isConsumable ? "Buy" : "Purchase"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
