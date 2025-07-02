import { Link, useLocation } from "wouter";
import { 
  Home,
  Gamepad2,
  Wallet,
  MessageSquare,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", icon: <Home className="h-6 w-6" />, label: "Home" },
    { href: "/slots", icon: <Gamepad2 className="h-6 w-6" />, label: "Games" },
    { href: "/wallet", icon: <Wallet className="h-6 w-6" />, label: "Wallet" },
    { href: "/settings", icon: <Settings className="h-6 w-6" />, label: "Settings" },
  ];
  
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background-light border-t border-gray-800 z-10">
      <div className="flex justify-around p-2">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}>
            <a className={cn(
              "flex flex-col items-center p-2",
              location === item.href ? "text-white" : "text-gray-400"
            )}>
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
