import { Diamond, Award } from "lucide-react";

interface SquadRankBadgeProps {
    rank: number;
    squadName: string;
}

export function SquadRankBadge({ rank, squadName }: SquadRankBadgeProps) {
    const getRankConfig = (rank: number) => {
        switch (rank) {
            case 1:
                return {
                    title: "Diamond Squad",
                    icon: Diamond,
                    gradient: "from-cyan-400 via-blue-400 to-purple-500",
                    textGradient: "from-cyan-300 via-blue-300 to-purple-400",
                    shadow: "shadow-[0_0_30px_rgba(34,211,238,0.4)]",
                    glow: "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]",
                    iconColor: "text-cyan-300",
                };
            case 2:
                return {
                    title: "Gold Squad",
                    icon: Award,
                    gradient: "from-yellow-400 via-amber-400 to-orange-400",
                    textGradient: "from-yellow-300 via-amber-300 to-orange-300",
                    shadow: "shadow-[0_0_25px_rgba(251,191,36,0.4)]",
                    glow: "drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]",
                    iconColor: "text-yellow-300",
                };
            case 3:
                return {
                    title: "Silver Squad",
                    icon: Award,
                    gradient: "from-slate-300 via-gray-300 to-zinc-400",
                    textGradient: "from-slate-200 via-gray-200 to-zinc-300",
                    shadow: "shadow-[0_0_20px_rgba(203,213,225,0.3)]",
                    glow: "drop-shadow-[0_0_5px_rgba(203,213,225,0.7)]",
                    iconColor: "text-slate-300",
                };
            case 4:
                return {
                    title: "Bronze Squad",
                    icon: Award,
                    gradient: "from-orange-600 via-amber-700 to-yellow-800",
                    textGradient: "from-orange-500 via-amber-600 to-yellow-700",
                    shadow: "shadow-[0_0_15px_rgba(234,88,12,0.3)]",
                    glow: "drop-shadow-[0_0_4px_rgba(234,88,12,0.6)]",
                    iconColor: "text-orange-500",
                };
            default:
                return null;
        }
    };

    const config = getRankConfig(rank);

    if (!config) return null;

    const Icon = config.icon;

    return (
        <div className="flex items-center gap-3 mb-2">
            <div className={`${config.glow}`}>
                <Icon className={`w-6 h-6 ${config.iconColor} animate-pulse`} />
            </div>
            <div className="flex flex-col">
                <span
                    className={`text-sm font-black tracking-wider uppercase bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent ${config.shadow}`}
                    style={{
                        fontFamily: "'Orbitron', 'Rajdhani', 'Exo 2', sans-serif",
                        letterSpacing: "0.1em",
                        backgroundSize: "200% auto",
                        animation: "shimmer 3s linear infinite",
                    }}
                >
                    {config.title}
                </span>
            </div>
        </div>
    );
}
