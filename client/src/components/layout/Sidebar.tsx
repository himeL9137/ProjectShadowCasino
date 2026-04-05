import { Link, useLocation } from "wouter";
import {
  Gamepad2, Dice5, TrendingUp,
  MessageSquare, DollarSign, User, Wallet,
  ClipboardList, ShieldAlert, Activity,
  Palette, ChevronLeft, ChevronRight, Users,
  Home, Layers
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/providers/LanguageProvider";
import { useState, useEffect } from "react";
const projectShadowLogo = "/assets/new-logo.png";

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

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
  badge?: React.ReactNode;
}

function NavItem({ href, icon, label, isCollapsed, isActive, badge }: NavItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href}>
          <div
            className={`
              relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 cursor-pointer text-sm font-medium
              ${isActive
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"}
              ${isCollapsed ? "justify-center px-0" : ""}
            `}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-400 rounded-full" />
            )}
            <span className={`flex-shrink-0 ${isActive ? "text-violet-400" : ""}`}>{icon}</span>
            {!isCollapsed && <span className="truncate">{label}</span>}
            {!isCollapsed && badge}
          </div>
        </Link>
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right" className="text-xs">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function SectionLabel({ label, isCollapsed }: { label: string; isCollapsed: boolean }) {
  if (isCollapsed) return <div className="my-2 border-t border-white/5" />;
  return (
    <div className="px-3 pt-4 pb-1">
      <span className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase">{label}</span>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const [customGames, setCustomGames] = useState<CustomGame[]>([]);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isAuthorizedAdmin =
    isAdmin &&
    ["shadowHimel", "shadowTalha", "shadowKaran", "Albab AJ"].includes(user?.username || "");

  useEffect(() => {
    if (!user) return;
    fetch("/api/games/custom")
      .then((r) => r.ok ? r.json() : [])
      .then((games) => setCustomGames(games.filter((g: CustomGame) => g.isActive)))
      .catch(() => {});
  }, [user]);

  const isActive = (route: string) => {
    if (route === "/" && location === "/") return true;
    if (route !== "/" && location.startsWith(route)) return true;
    return false;
  };

  const isCollapsed = state === "collapsed";

  return (
    <div
      className={`
        min-h-screen flex flex-col border-r border-white/5 transition-all duration-300 ease-in-out relative z-50
        ${isCollapsed ? "w-16" : "w-64"}
      `}
      style={{ background: "linear-gradient(180deg, #0f0c1e 0%, #0a0a14 100%)" }}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-5 z-10">
        <Button
          onClick={toggleSidebar}
          size="sm"
          variant="outline"
          className="h-6 w-6 rounded-full border-white/10 bg-gray-900 hover:bg-gray-800 transition-all duration-200 shadow-lg p-0"
          title={`${isCollapsed ? "Expand" : "Collapse"} sidebar`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-gray-400" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-gray-400" />
          )}
        </Button>
      </div>

      {/* Logo */}
      <div className={`flex items-center gap-3 p-5 pb-4 ${isCollapsed ? "px-3 justify-center" : ""}`}>
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="relative flex-shrink-0">
              <img
                src={projectShadowLogo}
                alt="Project Shadow"
                className={`${isCollapsed ? "h-8 w-8" : "h-9 w-9"} object-contain`}
              />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-gray-900" />
            </div>
            {!isCollapsed && (
              <div>
                <div className="text-white font-bold text-sm leading-none tracking-wide">PROJECT SHADOW</div>
                <div className="text-gray-600 text-xs mt-0.5">Gaming Platform</div>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/5 mb-2" />

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? "px-2" : "px-3"}`}>

        <SectionLabel label="Menu" isCollapsed={isCollapsed} />
        <NavItem href="/" icon={<Home className="h-4 w-4" />} label={t("nav.home")} isCollapsed={isCollapsed} isActive={isActive("/") && !location.includes("/account") && !location.includes("/admin")} />
        <NavItem href="/games" icon={<Activity className="h-4 w-4" />} label={t("nav.games")} isCollapsed={isCollapsed} isActive={isActive("/games")} />

        <SectionLabel label="Games" isCollapsed={isCollapsed} />
        <NavItem href="/slots" icon={<Gamepad2 className="h-4 w-4" />} label="Slots" isCollapsed={isCollapsed} isActive={isActive("/slots")} />
        <NavItem href="/mines" icon={<Layers className="h-4 w-4" />} label="Mines" isCollapsed={isCollapsed} isActive={isActive("/mines")} />

        {isAdmin && (
          <>
            <NavItem
              href="/dice"
              icon={<Dice5 className="h-4 w-4" />}
              label="Dice"
              isCollapsed={isCollapsed}
              isActive={isActive("/dice")}
              badge={
                !isCollapsed ? (
                  <span className="ml-auto text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">Admin</span>
                ) : undefined
              }
            />
            <NavItem
              href="/plinko_master"
              icon={<TrendingUp className="h-4 w-4" />}
              label="Plinko"
              isCollapsed={isCollapsed}
              isActive={isActive("/plinko_master")}
              badge={
                !isCollapsed ? (
                  <span className="ml-auto text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">Admin</span>
                ) : undefined
              }
            />
          </>
        )}

        {!isCollapsed && customGames.length > 0 && (
          <>
            <SectionLabel label="Custom Games" isCollapsed={isCollapsed} />
            {customGames.slice(0, 5).map((game) => (
              <Link key={game.id} href={`/html-game/${game.id}`}>
                <div
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition-all duration-200 cursor-pointer text-sm
                    ${isActive(`/html-game/${game.id}`)
                      ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"}
                  `}
                >
                  <span className="text-base flex-shrink-0">🎮</span>
                  <span className="truncate">{game.name}</span>
                  {game.type && (
                    <span className="ml-auto text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {game.type.toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {customGames.length > 5 && (
              <Link href="/games">
                <div className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
                  +{customGames.length - 5} more games →
                </div>
              </Link>
            )}
          </>
        )}

        <SectionLabel label="Explore" isCollapsed={isCollapsed} />
        <NavItem href="/leaderboard" icon={<TrendingUp className="h-4 w-4" />} label={t("nav.leaderboard")} isCollapsed={isCollapsed} isActive={isActive("/leaderboard")} />
        <NavItem href="/chat" icon={<MessageSquare className="h-4 w-4" />} label={t("nav.chat")} isCollapsed={isCollapsed} isActive={isActive("/chat")} />
        <NavItem href="/currency" icon={<DollarSign className="h-4 w-4" />} label={t("nav.currency")} isCollapsed={isCollapsed} isActive={isActive("/currency")} />

        <SectionLabel label="Account" isCollapsed={isCollapsed} />
        <NavItem href="/account/profile" icon={<User className="h-4 w-4" />} label="Profile" isCollapsed={isCollapsed} isActive={isActive("/account/profile")} />
        <NavItem href="/account/wallet" icon={<Wallet className="h-4 w-4" />} label="Wallet" isCollapsed={isCollapsed} isActive={isActive("/account/wallet")} />
        <NavItem href="/account/history" icon={<ClipboardList className="h-4 w-4" />} label="History" isCollapsed={isCollapsed} isActive={isActive("/account/history")} />
        <NavItem href="/account/referrals" icon={<Users className="h-4 w-4" />} label="Referrals" isCollapsed={isCollapsed} isActive={isActive("/account/referrals")} />

        {isAuthorizedAdmin && (
          <>
            <SectionLabel label="Administration" isCollapsed={isCollapsed} />
            <NavItem
              href="/admin"
              icon={<ShieldAlert className="h-4 w-4" />}
              label="Admin Panel"
              isCollapsed={isCollapsed}
              isActive={isActive("/admin")}
              badge={
                !isCollapsed ? (
                  <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">Super</span>
                ) : undefined
              }
            />
          </>
        )}

        <SectionLabel label="Appearance" isCollapsed={isCollapsed} />
        <NavItem href="/themes" icon={<Palette className="h-4 w-4" />} label={t("nav.themes")} isCollapsed={isCollapsed} isActive={isActive("/themes")} />
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="text-xs text-gray-700 text-center">
            © 2025 Project Shadow
          </div>
        </div>
      )}
    </div>
  );
}
