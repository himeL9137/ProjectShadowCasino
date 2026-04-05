import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/providers/LanguageProvider";
import { Trophy, Users, Zap, TrendingUp, ChevronRight, Star } from "lucide-react";

interface CustomGame {
  id: number;
  name: string;
  type: string;
  htmlContent: string;
  winChance: number;
  maxMultiplier: number;
  minBet: string;
  maxBet: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: number;
}

const SlotsIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
    <rect x="8" y="12" width="48" height="40" rx="6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
    <rect x="14" y="18" width="10" height="28" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
    <rect x="27" y="18" width="10" height="28" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
    <rect x="40" y="18" width="10" height="28" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
    <circle cx="19" cy="32" r="4" fill="#fbbf24"/>
    <circle cx="32" cy="32" r="4" fill="#f87171"/>
    <circle cx="45" cy="32" r="4" fill="#34d399"/>
    <rect x="20" y="54" width="24" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
  </svg>
);

const DiceIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
    <rect x="8" y="8" width="28" height="28" rx="6" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
    <circle cx="18" cy="18" r="3" fill="white"/>
    <circle cx="26" cy="18" r="3" fill="white"/>
    <circle cx="18" cy="26" r="3" fill="white"/>
    <circle cx="26" cy="26" r="3" fill="white"/>
    <rect x="28" y="28" width="28" height="28" rx="6" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
    <circle cx="42" cy="42" r="3.5" fill="white"/>
  </svg>
);

const MinesIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
    <rect x="4" y="4" width="14" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <rect x="25" y="4" width="14" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <rect x="46" y="4" width="14" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <rect x="4" y="25" width="14" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <rect x="25" y="25" width="14" height="14" rx="3" fill="#ef4444" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <text x="29" y="36" fontSize="10" fill="white" fontWeight="bold">💣</text>
    <rect x="46" y="25" width="14" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <rect x="4" y="46" width="14" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <rect x="25" y="46" width="14" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <rect x="46" y="46" width="14" height="14" rx="3" fill="#10b981" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <path d="M50 53l4 4M50 57l4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PlinkoIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
    <circle cx="32" cy="8" r="5" fill="#fbbf24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
    <circle cx="16" cy="20" r="3" fill="rgba(255,255,255,0.4)"/>
    <circle cx="32" cy="20" r="3" fill="rgba(255,255,255,0.4)"/>
    <circle cx="48" cy="20" r="3" fill="rgba(255,255,255,0.4)"/>
    <circle cx="8" cy="32" r="3" fill="rgba(255,255,255,0.3)"/>
    <circle cx="24" cy="32" r="3" fill="rgba(255,255,255,0.3)"/>
    <circle cx="40" cy="32" r="3" fill="rgba(255,255,255,0.3)"/>
    <circle cx="56" cy="32" r="3" fill="rgba(255,255,255,0.3)"/>
    <circle cx="16" cy="44" r="3" fill="rgba(255,255,255,0.2)"/>
    <circle cx="32" cy="44" r="3" fill="rgba(255,255,255,0.2)"/>
    <circle cx="48" cy="44" r="3" fill="rgba(255,255,255,0.2)"/>
    <rect x="4" y="54" width="12" height="6" rx="2" fill="#ef4444"/>
    <rect x="18" y="54" width="12" height="6" rx="2" fill="#f97316"/>
    <rect x="32" y="54" width="12" height="6" rx="2" fill="#eab308"/>
    <rect x="46" y="54" width="12" height="6" rx="2" fill="#22c55e"/>
  </svg>
);

const gameCards = [
  {
    id: "slots",
    href: "/slots",
    title: "Slots",
    description: "Classic 3×3 slot machine. Spin to win up to 20× your bet!",
    gradient: "from-violet-900 via-purple-800 to-indigo-900",
    glowColor: "rgba(139,92,246,0.4)",
    badge: "Popular",
    badgeColor: "bg-violet-500/30 text-violet-200 border border-violet-500/30",
    icon: <SlotsIcon />,
    multiplier: "20×",
  },
  {
    id: "dice",
    href: "/dice",
    title: "Dice",
    description: "Over/Under dice game. Pick your target and roll the odds!",
    gradient: "from-sky-900 via-blue-800 to-cyan-900",
    glowColor: "rgba(14,165,233,0.4)",
    badge: "Classic",
    badgeColor: "bg-sky-500/30 text-sky-200 border border-sky-500/30",
    icon: <DiceIcon />,
    multiplier: "9.9×",
  },
  {
    id: "mines",
    href: "/mines",
    title: "Mines",
    description: "Find gems and dodge mines. Higher risk means higher rewards!",
    gradient: "from-slate-900 via-gray-800 to-zinc-900",
    glowColor: "rgba(100,116,139,0.4)",
    badge: "High Risk",
    badgeColor: "bg-red-500/30 text-red-200 border border-red-500/30",
    icon: <MinesIcon />,
    multiplier: "26×",
  },
  {
    id: "plinko",
    href: "/plinko_master",
    title: "Plinko",
    description: "Advanced physics-based plinko with 16 multiplier slots!",
    gradient: "from-purple-900 via-indigo-800 to-violet-900",
    glowColor: "rgba(99,102,241,0.4)",
    badge: "New",
    badgeColor: "bg-emerald-500/30 text-emerald-200 border border-emerald-500/30",
    icon: <PlinkoIcon />,
    multiplier: "1000×",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const HomePage = React.memo(function HomePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [winners, setWinners] = useState<any[]>([]);
  const [isLoadingWinners, setIsLoadingWinners] = useState(false);
  const [customGames, setCustomGames] = useState<CustomGame[]>([]);
  const [loadingCustomGames, setLoadingCustomGames] = useState(false);
  const { toast } = useToast();

  const formatMoney = useCallback((amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  }, []);

  useEffect(() => {
    const fetchWinners = async () => {
      setIsLoadingWinners(true);
      try {
        const response = await fetch("/api/games/winners?limit=5");
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        setWinners(data);
      } catch {
      } finally {
        setIsLoadingWinners(false);
      }
    };
    fetchWinners();
  }, []);

  useEffect(() => {
    const fetchCustomGames = async () => {
      if (!user) return;
      setLoadingCustomGames(true);
      try {
        const response = await fetch("/api/games/custom");
        if (response.ok) {
          const games = await response.json();
          setCustomGames(games.filter((g: CustomGame) => g.isActive));
        }
      } catch {
      } finally {
        setLoadingCustomGames(false);
      }
    };
    fetchCustomGames();
  }, [user]);

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden mb-10 border border-white/10"
          style={{
            background: "linear-gradient(135deg, #1e1035 0%, #0f172a 40%, #0c1a2e 100%)",
          }}
        >
          {/* Glow blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
            <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #2563eb, transparent)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 opacity-10 blur-3xl" style={{ background: "radial-gradient(ellipse, #06b6d4, transparent)" }} />
          </div>

          <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Live Casino</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Shadow Casino
                </span>
              </h1>
              <p className="text-gray-400 text-base max-w-lg">
                Play provably fair games with instant payouts. Choose your game and start winning today.
              </p>
            </div>
            <Link href="/games">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
              >
                <Zap className="w-4 h-4" />
                Play Now
              </motion.button>
            </Link>
          </div>

          {/* Stats strip */}
          <div className="relative z-10 border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
            {[
              { icon: <Users className="w-4 h-4" />, label: "Active Players", value: "2,400+" },
              { icon: <Trophy className="w-4 h-4" />, label: "Total Paid Out", value: "$1.2M+" },
              { icon: <TrendingUp className="w-4 h-4" />, label: "Biggest Win", value: "1000×" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col sm:flex-row items-center justify-center gap-2 py-4 px-2">
                <span className="text-violet-400">{stat.icon}</span>
                <div className="text-center sm:text-left">
                  <div className="text-white font-bold text-sm sm:text-base">{stat.value}</div>
                  <div className="text-gray-500 text-xs hidden sm:block">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Games Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Featured Games</h2>
            <Link href="/games">
              <button className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {gameCards.map((game) => (
              <motion.div key={game.id} variants={cardVariants}>
                <Link href={game.href}>
                  <div
                    className="group bg-card rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                    style={{ boxShadow: `0 0 0 0 ${game.glowColor}` }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${game.glowColor}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 0 ${game.glowColor}`;
                    }}
                  >
                    {/* Card image area */}
                    <div className={`bg-gradient-to-br ${game.gradient} aspect-[4/3] flex items-center justify-center relative overflow-hidden`}>
                      {/* Subtle mesh pattern */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      />

                      {/* Icon */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="group-hover:scale-110 transition-transform duration-300">
                          {game.icon}
                        </div>
                        <div className="mt-3 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold">
                          Up to {game.multiplier}
                        </div>
                      </div>

                      {/* Badge */}
                      <div className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full ${game.badgeColor}`}>
                        {game.badge}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="font-bold text-white text-base mb-1">{game.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-3">{game.description}</p>
                      <button className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 group-hover:opacity-100"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                        Play Now
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom row: Winners + Community */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Recent Winners */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <h3 className="font-bold text-white">Recent Winners</h3>
              </div>
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="p-2">
              {isLoadingWinners ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-3 bg-white/10 rounded w-24 mb-1" />
                      <div className="h-2 bg-white/10 rounded w-16" />
                    </div>
                    <div className="h-4 bg-white/10 rounded w-12" />
                  </div>
                ))
              ) : winners.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">No recent winners yet</div>
              ) : (
                winners.slice(0, 5).map((winner, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                      {winner.username?.substring(0, 2)?.toUpperCase() || "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{winner.username || "Anonymous"}</div>
                      <div className="text-xs text-gray-500">{winner.gameType || "Game"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">+${formatMoney(winner.amount || 0)}</div>
                      <div className="text-xs text-gray-500">{winner.multiplier ? `${winner.multiplier}×` : ""}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Community + Quick Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* Promo card */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 p-6 flex-1"
              style={{ background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 text-sm font-semibold">Welcome Bonus</span>
                </div>
                <h3 className="text-white text-lg font-bold mb-1">Get 100% Deposit Match</h3>
                <p className="text-gray-400 text-sm mb-4">
                  New members get a bonus on their first deposit. Join thousands of players winning daily.
                </p>
                <Link href="/account/wallet">
                  <button className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                    Claim Bonus
                  </button>
                </Link>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { href: "/chat", label: "Live Chat", sub: "Talk to players", icon: "💬" },
                { href: "/leaderboard", label: "Leaderboard", sub: "Top winners", icon: "🏆" },
                { href: "/account/referrals", label: "Referrals", sub: "Earn commissions", icon: "🤝" },
                {
                  href: "https://wa.me/01989379895",
                  label: "Support",
                  sub: "24/7 help",
                  icon: "✆",
                  external: true,
                },
              ].map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-white/5 hover:border-white/20 rounded-xl p-4 flex items-center gap-3 transition-all hover:bg-white/5 cursor-pointer"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.sub}</div>
                    </div>
                  </a>
                ) : (
                  <Link key={item.label} href={item.href}>
                    <div className="bg-card border border-white/5 hover:border-white/20 rounded-xl p-4 flex items-center gap-3 transition-all hover:bg-white/5 cursor-pointer">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.sub}</div>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          </motion.div>
        </div>

        {/* Custom Games Section */}
        {user && (loadingCustomGames || customGames.length > 0) && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Custom Games</h2>
              {customGames.length > 8 && (
                <Link href="/games">
                  <button className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {loadingCustomGames
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse border border-white/5">
                      <div className="bg-white/5 aspect-[4/3]" />
                      <div className="p-4">
                        <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
                        <div className="h-3 bg-white/10 rounded mb-3 w-1/2" />
                        <div className="h-8 bg-white/10 rounded" />
                      </div>
                    </div>
                  ))
                : customGames.slice(0, 8).map((game) => (
                    <div key={game.id} className="bg-card rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                        <div className="text-5xl">🎮</div>
                        <div className="absolute top-3 right-3 bg-violet-500/30 text-violet-200 border border-violet-500/30 text-xs font-medium px-2 py-0.5 rounded-full">
                          {game.type.toUpperCase()}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-white text-sm mb-1 truncate">{game.name}</h3>
                        <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                          {game.description || `Win: ${game.winChance}% • Max: ${game.maxMultiplier}×`}
                        </p>
                        <Link href={`/html-game/${game.id}`}>
                          <button className="w-full py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                            Play Now
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
});

export default HomePage;
