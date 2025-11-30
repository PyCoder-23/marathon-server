"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const handleStartTraining = () => {
    if (user) {
      router.push("/missions");
    } else {
      router.push("/signup");
    }
  };

  const handleViewDashboard = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-12 relative overflow-hidden">
      {/* Background Grid Animation */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'grid 20s linear infinite'
        }}>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-0 pointer-events-none"></div>

      <main className="flex flex-col items-center gap-8 z-10 max-w-4xl w-full text-center">
        <div className="space-y-4 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_30px_rgba(0,255,149,0.5)] mb-4 animate-glow">
            <img src="/logo.jpg" alt="Marathon Logo" className="object-cover w-full h-full" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 animate-pulse-slow drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            MARATHON
            <span className="block text-primary text-4xl md:text-6xl mt-2 drop-shadow-[0_0_10px_rgba(0,255,149,0.8)]">SERVER</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Train Your Consistency. The futuristic training camp for disciplined students.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="group relative">
            <Button
              size="lg"
              className="text-lg px-8 hover:animate-pulse shadow-[0_0_15px_rgba(0,255,149,0.3)] hover:shadow-[0_0_25px_rgba(0,255,149,0.6)] transition-all duration-300"
              onClick={handleStartTraining}
              title="Begin your study journey"
            >
              Start Training
            </Button>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
              Begin your study journey
            </span>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 border-primary/50 text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(0,255,149,0.2)] transition-all duration-300"
            onClick={handleViewDashboard}
          >
            View Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
          <Card className="border-primary/20 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-primary">Missions</CardTitle>
              <CardDescription>Complete daily objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[60%] shadow-[0_0_10px_var(--primary)]"></div>
              </div>
              <p className="text-xs text-right mt-2 text-muted">3/5 Completed</p>
            </CardContent>
          </Card>

          <Card className="border-cyan-400/20 hover:border-cyan-400/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-cyan-400">Squads</CardTitle>
              <CardDescription>Compete with your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">Rank #1</span>
                <span className="text-cyan-400 text-sm">Top 1%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 hover:border-white/30 transition-colors">
            <CardHeader>
              <CardTitle>Stats</CardTitle>
              <CardDescription>Track your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">
                124<span className="text-sm text-muted ml-1">hrs</span>
              </div>
              <p className="text-xs text-muted mt-1">Total Study Time</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
