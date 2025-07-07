import { Link, useLocation } from "wouter";
import { 
  Gamepad2, Dice5, TrendingUp,
  MessageSquare, DollarSign, User, Wallet,
  ClipboardList, ShieldAlert, Activity,
  Palette, Settings, ChevronLeft, ChevronRight, Menu, Users, Pin
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { ThemeSelector } from "@/components/common/ThemeSelector";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/providers/LanguageProvider";
const projectShadowLogo = "/assets/new-logo.png";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { state, open, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  
  // Only allow specific admin users access to admin panel
  const isAdmin = user?.role === UserRole.ADMIN;
  const isAuthorizedAdmin = isAdmin && (user?.username === "shadowHimel" || user?.username === "shadowTalha" || user?.username === "shadowKaran" || user?.username === "Albab AJ");
  const isRouteActive = (route: string) => {
    if (route === "/" && location === "/") return true;
    if (route !== "/" && location.startsWith(route)) return true;
    return false;
  };

  const isCollapsed = state === "collapsed";

  return (
    <div 
      className={`bg-background-darker min-h-screen flex flex-col border-r border-border transition-all duration-300 ease-in-out relative ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{
        width: isCollapsed ? '4rem' : '16rem'
      }}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-4 sidebar-toggle-button z-10">
        <Button
          onClick={toggleSidebar}
          size="sm"
          variant="outline"
          className="h-6 w-6 rounded-full border-border bg-background-darker hover:bg-background-light transition-all duration-200 hover:scale-110 shadow-md"
          title={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>

      {/* Logo */}
      <div className={`p-6 pb-2 transition-all duration-300 ${isCollapsed ? "px-3" : "px-6"}`}>
        <Link href="/">
          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img 
              src={projectShadowLogo} 
              alt="Project Shadow" 
              className={`${isCollapsed ? "h-8 w-8 object-contain" : "h-12"} w-auto transition-all duration-300`}
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white">
                  PROJECT SHADOW
                </h1>
                <p className="text-sm text-gray-400">Gaming Platform</p>
              </div>
            )}
          </div>
        </Link>
      </div>
      
      {/* Navigation Menu */}
      <nav className={`flex-1 transition-all duration-300 ${isCollapsed ? "p-2" : "p-4"}`}>
        <div className="mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <div className={`flex items-center p-2 rounded-md mb-1 ${
                  isRouteActive("/") && !location.includes("/account") && !location.includes("/admin")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <Gamepad2 className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>{t('nav.home')}</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>{t('nav.home')}</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/games">
                <div className={`flex items-center p-2 rounded-md mb-1 ${
                  isRouteActive("/games")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <Activity className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>{t('nav.games')}</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>{t('nav.games')}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {!isCollapsed && (
            <>
              <Link href="/slots">
                <div className={`flex items-center p-2 rounded-md mb-1 pl-10 ${
                  isRouteActive("/slots")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer`}>
                  <span>Slots</span>
                </div>
              </Link>
              
              {/* Admin-only games */}
              {isAdmin && (
                <>
                  <Link href="/dice">
                    <div className={`flex items-center p-2 rounded-md mb-1 pl-10 ${
                      isRouteActive("/dice")
                        ? "bg-background-light text-primary"
                        : "text-gray-300 hover:bg-background-light hover:text-primary"
                    } transition-colors cursor-pointer`}>
                      <span>Dice 🔒</span>
                    </div>
                  </Link>
                  
                  <Link href="/plinko_master">
                    <div className={`flex items-center p-2 rounded-md mb-1 pl-10 ${
                      isRouteActive("/plinko_master")
                        ? "bg-background-light text-primary"
                        : "text-gray-300 hover:bg-background-light hover:text-primary"
                    } transition-colors cursor-pointer`}>
                      <span>Plinko 🔒</span>
                    </div>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/leaderboard">
              <div className={`flex items-center p-2 rounded-md mb-1 ${
                isRouteActive("/leaderboard")
                  ? "bg-background-light text-primary"
                  : "text-gray-300 hover:bg-background-light hover:text-primary"
              } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                <TrendingUp className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                {!isCollapsed && <span>{t('nav.leaderboard')}</span>}
              </div>
            </Link>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>{t('nav.leaderboard')}</p>
            </TooltipContent>
          )}
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/chat">
              <div className={`flex items-center p-2 rounded-md mb-6 ${
                isRouteActive("/chat")
                  ? "bg-background-light text-primary"
                  : "text-gray-300 hover:bg-background-light hover:text-primary"
              } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                <MessageSquare className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                {!isCollapsed && <span>{t('nav.chat')}</span>}
              </div>
            </Link>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>{t('nav.chat')}</p>
            </TooltipContent>
          )}
        </Tooltip>
        
        <div className="border-t border-gray-800 pt-4 mb-6">
          {!isCollapsed && <p className="text-xs text-gray-400 mb-2 px-2">{t('nav.currency').toUpperCase()}</p>}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/currency">
                <div className={`flex items-center p-2 rounded-md mb-6 ${
                  isRouteActive("/currency")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <DollarSign className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>{t('nav.currency')}</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Currency Switcher</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
        
        <div className="border-t border-gray-800 pt-4">
          {!isCollapsed && <p className="text-xs text-gray-400 mb-2 px-2">ACCOUNT</p>}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/account/profile">
                <div className={`flex items-center p-2 rounded-md mb-1 ${
                  isRouteActive("/account/profile")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <User className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>Profile</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Profile</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/account/wallet">
                <div className={`flex items-center p-2 rounded-md mb-1 ${
                  isRouteActive("/account/wallet")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <Wallet className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>Wallet</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Wallet</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/account/history">
                <div className={`flex items-center p-2 rounded-md mb-1 ${
                  isRouteActive("/account/history")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <ClipboardList className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>Transaction History</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Transaction History</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/account/referrals">
                <div className={`flex items-center p-2 rounded-md mb-1 ${
                  isRouteActive("/account/referrals")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <Users className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>Referral Program</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Referral Program</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          {isAuthorizedAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/admin">
                  <div className={`flex items-center p-2 rounded-md mb-1 ${
                    isRouteActive("/admin")
                      ? "bg-background-light text-primary"
                      : "text-gray-300 hover:bg-background-light hover:text-primary"
                  } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                    <ShieldAlert className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                    {!isCollapsed && (
                      <>
                        <span>Admin Panel</span>
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">Super</span>
                      </>
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>Admin Panel</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
        <div className="border-t border-gray-800 pt-4 mt-4">
          {!isCollapsed && <p className="text-xs text-gray-400 mb-2 px-2">APPEARANCE</p>}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/themes">
                <div className={`flex items-center p-2 rounded-md mb-1 ${
                  isRouteActive("/themes")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <Palette className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>{t('nav.themes')}</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Themes</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/pin-demo">
                <div className={`flex items-center p-2 rounded-md mb-1 ${
                  isRouteActive("/pin-demo")
                    ? "bg-background-light text-primary"
                    : "text-gray-300 hover:bg-background-light hover:text-primary"
                } transition-colors cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
                  <Pin className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                  {!isCollapsed && <span>3D Pin Demo</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>3D Pin Demo</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </nav>
    </div>
  );
}