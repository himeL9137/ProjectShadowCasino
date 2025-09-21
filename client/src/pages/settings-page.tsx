import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useTheme } from "@/hooks/use-theme";
import { useCurrency } from "@/hooks/use-currency";
import { useAuth } from "@/hooks/use-auth";
import { themes } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Currency } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const { currentTheme, setTheme } = useTheme();
  const { currency, setCurrency, getCurrencySymbol, availableCurrencies } = useCurrency();
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">Settings</h2>
          
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-background-light border-gray-800 w-full justify-start">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-background-light border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your account details and personal information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Username</label>
                      <p className="text-white font-medium">{user?.username}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Phone</label>
                      <p className="text-white font-medium">{user?.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Account Type</label>
                      <p className="text-white font-medium">
                        {user?.role === "admin" ? (
                          <span className="text-accent-gold">Administrator</span>
                        ) : (
                          "Regular User"
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-800">
                    <Button 
                      variant="destructive" 
                      className="flex items-center"
                      onClick={async () => {
                        setIsLoggingOut(true);
                        try {
                          await logout();
                        } catch (error) {
                          console.error("Logout error:", error);
                        } finally {
                          setIsLoggingOut(false);
                        }
                      }}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card className="bg-background-light border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Theme Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize the look and feel of the application.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {themes.map((theme) => (
                      <div 
                        key={theme.id}
                        className={`bg-background-darker rounded-lg p-2 cursor-pointer transition-all duration-200 ${
                          currentTheme.id === theme.id ? 'border-2 border-primary' : 'border-2 border-transparent hover:border-gray-700'
                        }`}
                        onClick={() => setTheme(theme.id)}
                      >
                        <div className="rounded-lg mb-2 p-3" style={{ backgroundColor: theme.colors.background }}>
                          <div className="flex space-x-1 mb-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                          </div>
                          <div className="h-10 rounded" style={{ backgroundColor: theme.colors.background === '#121126' ? '#1E1E3F' : theme.colors.background }}></div>
                        </div>
                        <p className="text-center text-white text-sm">{theme.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="bg-background-light border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Currency Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose your preferred currency for transactions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {availableCurrencies.map((currencyOption) => (
                      <div 
                        key={currencyOption}
                        className={`bg-background-darker rounded-lg p-6 cursor-pointer text-center transition-all duration-200 ${
                          currency === currencyOption ? 'border-2 border-primary' : 'border-2 border-transparent hover:border-gray-700'
                        }`}
                        onClick={() => setCurrency(currencyOption)}
                      >
                        <div className="text-3xl mb-2">
                          {getCurrencySymbol(currencyOption)}
                        </div>
                        <p className="text-white font-medium">{currencyOption}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-background-light border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Game Preferences</CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize your gaming experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Game preference settings coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
}
