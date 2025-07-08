import { Link, useLocation } from "wouter";
import { DollarSign, ChevronDown, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useSidebar } from "@/components/ui/sidebar";
import { useState, useEffect, useRef } from "react";
import { Currency } from "@shared/schema";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { useQuery } from "@tanstack/react-query";
import { CompactLanguageSelector } from "@/components/ui/language-selector";
const projectShadowLogo = "/assets/new-logo.png";

export function Header() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const { 
    currency: userCurrency, 
    setCurrency, 
    getCurrencySymbol, 
    isChangingCurrency,
    availableCurrencies 
  } = useCurrency();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [balance, setBalance] = useState<string>(user?.balance || "0.00");
  const [currency, setCurrencyState] = useState<Currency>(user?.currency as Currency || Currency.USD);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Create refs for the menu components
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If the click is outside the currency menu and it's open, close it
      if (currencyMenuRef.current && 
          !currencyMenuRef.current.contains(event.target as Node) && 
          isCurrencyMenuOpen) {
        setCurrencyMenuOpen(false);
      }
      
      // If the click is outside the user menu and it's open, close it
      if (userMenuRef.current && 
          !userMenuRef.current.contains(event.target as Node) && 
          isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
    }
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen, isCurrencyMenuOpen]);
  
  // Format balance with commas and 2 decimal places
  const formatBalance = (balance: string) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(balance || "0"));
  };
  
  // Fetch latest balance
  const fetchBalance = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/wallet/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setCurrencyState(data.currency as Currency);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Update balance whenever user data changes
  useEffect(() => {
    if (user) {
      setBalance(user.balance);
      setCurrencyState(user.currency as Currency);
    }
  }, [user]);
  
  // Set up an interval to refresh the balance periodically
  useEffect(() => {
    // Fetch initial balance
    fetchBalance();
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(() => {
      fetchBalance();
    }, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Use authenticated user data
  const userData = user || {
    username: "",
    balance: "0.00",
    currency: "USD",
    email: ""
  };
  
  const userInitials = userData.username ? userData.username.substring(0, 2).toUpperCase() : "U";
  
  // Fetch current profile picture
  const { data: profileData } = useQuery({
    queryKey: ['/api/profile/picture-url'],
    enabled: !!user,
    staleTime: 0, // Always refetch to get latest profile picture
    gcTime: 0  // Don't cache the result
  });
  
  const isCollapsed = state === "collapsed";

  return (
    <header className="h-16 bg-background-darker border-b border-border flex items-center justify-between px-4 sm:px-6 transition-all duration-300 ease-in-out">
      <div className="flex-1 flex items-center min-w-0">
        <Link href="/">
          <div className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
            <img 
              src={projectShadowLogo} 
              alt="Project Shadow" 
              className="h-8 sm:h-10 w-auto flex-shrink-0"
            />
            <div className="flex flex-col min-w-0 hidden sm:block">
              <span className="text-white font-bold text-sm sm:text-lg truncate">PROJECT SHADOW</span>
              <span className="text-gray-400 text-xs hidden md:block">Gaming Platform</span>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        {/* Real-time Balance Display */}
        <div className="flex items-center">
          <div className="px-2 sm:px-4 py-2 bg-background rounded-md border border-border flex items-center">
            <BalanceDisplay compact={true} showCurrency={true} className="text-white text-sm sm:text-base" />
          </div>
        </div>
        
        {/* Currency Dropdown - Combined with Currency Switcher */}
        <div className="relative hidden sm:block" ref={currencyMenuRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCurrencyMenuOpen(!isCurrencyMenuOpen);
            }}
            className="px-2 sm:px-3 py-2 bg-background rounded-md border border-border flex items-center text-sm sm:text-base"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            <span>{userCurrency}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
            {isChangingCurrency && <span className="absolute top-0 right-0 h-3 w-3 bg-primary rounded-full border-2 border-background-darker animate-pulse"></span>}
          </button>
          
          {isCurrencyMenuOpen && (
            <div 
              className="absolute top-full right-0 mt-2 w-48 bg-background-light rounded-md shadow-lg border border-border z-50"
            >
              <div className="p-2 border-b border-border">
                <div className="font-medium">Select Currency</div>
              </div>
              
              <div className="p-2">
                {availableCurrencies.map((currencyOption) => (
                  <div 
                    key={currencyOption}
                    className={`p-2 rounded-md transition-colors cursor-pointer flex items-center justify-between ${
                      currencyOption === userCurrency 
                        ? "bg-primary/20 text-primary" 
                        : "hover:bg-background"
                    }`}
                    onClick={() => {
                      console.log(`Setting currency to ${currencyOption} from ${userCurrency}`);
                      setCurrency(currencyOption);
                      setCurrencyMenuOpen(false);
                    }}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{getCurrencySymbol(currencyOption)}</span>
                      <span>{currencyOption}</span>
                    </div>
                    {currencyOption === userCurrency && (
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Language Selector */}
        <CompactLanguageSelector className="shrink-0" />
        
        {/* Deposit Button */}
        <Link href="/account/wallet">
          <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            Deposit
          </button>
        </Link>
        
        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button 
            className="h-9 w-9 bg-primary rounded-full flex items-center justify-center text-white overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              setIsUserMenuOpen(!isUserMenuOpen);
            }}
          >
            {(profileData as any)?.profilePictureUrl && (profileData as any).profilePictureUrl !== '/assets/default-avatar.svg' ? (
              <img 
                src={`${(profileData as any).profilePictureUrl}?t=${Date.now()}`} 
                alt="Profile Picture" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Failed to load header profile picture');
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              userInitials
            )}
          </button>
          
          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-background-light rounded-md shadow-lg border border-border z-50">
              <div className="p-3 border-b border-border">
                <div className="font-medium">{user?.username}</div>
                <div className="text-sm text-gray-400">{user?.email}</div>
              </div>
              
              <div className="p-2">
                <Link href="/account/profile">
                  <div className="p-2 hover:bg-background rounded-md transition-colors cursor-pointer flex items-center">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Profile
                  </div>
                </Link>
                <Link href="/account/wallet">
                  <div className="p-2 hover:bg-background rounded-md transition-colors cursor-pointer flex items-center">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 14C17.1046 14 18 13.1046 18 12C18 10.8954 17.1046 10 16 10C14.8954 10 14 10.8954 14 12C14 13.1046 14.8954 14 16 14Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Wallet
                  </div>
                </Link>
                <Link href="/account/history">
                  <div className="p-2 hover:bg-background rounded-md transition-colors cursor-pointer flex items-center">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    History
                  </div>
                </Link>
                
                
                <div className="border-t border-border my-1"></div>
                
                <button 
                  className="w-full text-left p-2 hover:bg-background rounded-md transition-colors cursor-pointer text-red-500 flex items-center"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}