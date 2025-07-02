import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DollarSign, Check, Search, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { Currency } from "@shared/schema";
import { currencyMetadata, getCurrenciesByRegion } from "@/lib/currency-data";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GlobalCurrencyPage() {
  const { user } = useAuth();
  const { 
    currency: currentCurrency, 
    setCurrency, 
    isChangingCurrency,
    availableCurrencies 
  } = useCurrency();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [favoriteTab, setFavoriteTab] = useState<string>("all");
  const [favorites, setFavorites] = useState<Currency[]>([
    Currency.USD, Currency.EUR, Currency.JPY, Currency.GBP, Currency.BTC
  ]);
  
  // Get currencies organized by region
  const regionCurrencies = getCurrenciesByRegion();
  const regions = Object.keys(regionCurrencies).sort();
  
  // Function to handle currency change
  const handleCurrencyChange = async (currencyCode: Currency) => {
    if (isChangingCurrency) return;
    
    setError(null);
    
    try {
      await setCurrency(currencyCode);
      
      toast({
        title: "Currency Updated",
        description: `Your currency has been changed to ${currencyCode}`,
      });
      
      // Add a short delay and then refresh the page
      // This ensures all components update with the new currency
      setTimeout(() => {
        window.location.reload();
      }, 1500); // 1.5 second delay to allow the toast to be seen
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      toast({
        title: "Currency Change Failed",
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: "destructive"
      });
    }
  };
  
  // Toggle favorite currency
  const toggleFavorite = (currency: Currency) => {
    if (favorites.includes(currency)) {
      setFavorites(favorites.filter(c => c !== currency));
    } else {
      setFavorites([...favorites, currency]);
    }
  };
  
  // Filter currencies based on search term
  const filterCurrencies = (currencies: Currency[]) => {
    if (!searchTerm) return currencies;
    
    return currencies.filter(currency => {
      const metadata = currencyMetadata[currency];
      return (
        metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metadata.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metadata.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };
  
  // Render a currency card
  const renderCurrencyCard = (currencyCode: Currency) => {
    const metadata = currencyMetadata[currencyCode];
    const isFavorite = favorites.includes(currencyCode);
    
    return (
      <div
        key={currencyCode}
        className={`border rounded-lg p-4 cursor-pointer transition-all relative ${
          currencyCode === currentCurrency
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-background/5"
        } ${isChangingCurrency ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="absolute top-2 right-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currencyCode);
            }}
            className={`p-1 rounded-full ${isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
        
        <div 
          className="mt-2"
          onClick={() => handleCurrencyChange(currencyCode)}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <span className="text-2xl mr-2">{metadata.icon}</span>
              <span className="text-base font-semibold">{metadata.code}</span>
            </div>
            {currencyCode === currentCurrency && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{metadata.name}</p>
          <div className="flex items-center space-x-1">
            <span className="text-xl font-semibold">{metadata.symbol}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Region: {metadata.region}
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <DollarSign className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold">Global Currency Settings</h1>
        </div>
        
        <div className="bg-card rounded-lg p-4 sm:p-6 shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold">Select Your Currency</h2>
            <div className="w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search currencies..."
                  className="pl-10 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="all" onValueChange={setFavoriteTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Currencies</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              {regions.map(region => (
                <TabsTrigger key={region} value={region} className="hidden md:inline-flex">
                  {region}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filterCurrencies(Object.values(Currency)).map(renderCurrencyCard)}
              </div>
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filterCurrencies(favorites).map(renderCurrencyCard)}
              </div>
            </TabsContent>
            
            {regions.map(region => (
              <TabsContent key={region} value={region} className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filterCurrencies(regionCurrencies[region]).map(renderCurrencyCard)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          {error && (
            <div className="mt-6 p-3 bg-red-500/20 text-red-400 rounded-md flex items-center">
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="bg-card rounded-lg p-4 sm:p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">About Global Currencies</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Why We Support Multiple Currencies</h3>
              <p className="text-sm text-muted-foreground">
                Our casino caters to players from around the world, so we provide a wide range of
                currency options to make your gaming experience more comfortable and familiar.
                Choose the currency that works best for you!
              </p>
            </div>
            
            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Important Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your balance will be converted automatically</li>
                <li>• Exchange rates are updated regularly</li>
                <li>• Minimum bet amounts vary by currency</li>
                <li>• Add currencies to favorites for quick access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}