import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Palette, Star, Crown, Zap, Heart, Sparkles, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { allThemes, getThemeById } from "@/lib/themes";
import { useTheme } from "@/hooks/use-theme";

export default function ThemesPage() {
  const { currentTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleThemeChange = (themeId: string) => {
    // Add smooth transition visual feedback
    const themeCard = document.querySelector(`[data-theme-id="${themeId}"]`);
    if (themeCard) {
      themeCard.classList.add('theme-applying');
    }

    setTheme(themeId);
    
    // Show success message after transition completes
    setTimeout(() => {
      toast({
        title: "Theme Applied",
        description: `Successfully switched to ${getThemeById(themeId).name}`,
        variant: "default",
      });
      
      // Remove applying state
      if (themeCard) {
        themeCard.classList.remove('theme-applying');
      }
    }, 800);
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'dark': return Palette;
      case 'vibrant': return Zap;
      case 'elegant': return Crown;
      case 'neon': return Sparkles;
      case 'nature': return Heart;
      default: return Palette;
    }
  };

  const filteredThemes = selectedCategory === "all" 
    ? allThemes 
    : allThemes.filter(theme => theme.category === selectedCategory);

  const categories = [
    { id: "all", name: "All Themes" },
    { id: "dark", name: "Dark" },
    { id: "vibrant", name: "Vibrant" },
    { id: "elegant", name: "Elegant" },
    { id: "neon", name: "Neon" },
    { id: "nature", name: "Nature" }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold font-heading mb-4">
              <Palette className="inline mr-3" />
              Themes & Customization
            </h1>
            <p className="text-gray-400 text-lg">
              Personalize your gaming experience with our collection of themes
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="mb-2 category-filter transform transition-all duration-300 hover:scale-105"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThemes.map((theme, index) => {
              const IconComponent = getIconForCategory(theme.category);
              const isCurrentTheme = currentTheme.id === theme.id;
              
              return (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  data-theme-id={theme.id}
                >
                  <Card className={`theme-preview glow-effect relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl ${
                    isCurrentTheme ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-5 h-5" />
                          <CardTitle className="text-lg">{theme.name}</CardTitle>
                        </div>
                        <div className="flex space-x-2">
                          {isCurrentTheme && (
                            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                              Current
                            </Badge>
                          )}
                          {theme.popularity >= 4 && (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">{theme.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{theme.category}</span>
                        <span className="capitalize">{theme.mood}</span>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-400" />
                          <span>{theme.popularity}/5</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Theme Preview */}
                      <div 
                        className="w-full h-20 rounded-lg relative overflow-hidden gradient-animated"
                        style={{ background: theme.gradients.background }}
                      >
                        <div className="absolute inset-0" style={{ background: theme.gradients.card, opacity: 0.6 }}></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 right-2 flex space-x-1">
                          {Object.values(theme.colors).slice(0, 6).map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Key Colors */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300">Key Colors</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div
                              className="w-full h-8 rounded border border-gray-600"
                              style={{ backgroundColor: theme.colors.primary }}
                            />
                            <span className="text-xs text-gray-400 mt-1 block">Primary</span>
                          </div>
                          <div className="text-center">
                            <div
                              className="w-full h-8 rounded border border-gray-600"
                              style={{ backgroundColor: theme.colors.accent }}
                            />
                            <span className="text-xs text-gray-400 mt-1 block">Accent</span>
                          </div>
                          <div className="text-center">
                            <div
                              className="w-full h-8 rounded border border-gray-600"
                              style={{ backgroundColor: theme.colors.background }}
                            />
                            <span className="text-xs text-gray-400 mt-1 block">Background</span>
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <Button
                        onClick={() => handleThemeChange(theme.id)}
                        className="w-full glow-effect transition-all duration-300"
                        variant={isCurrentTheme ? "default" : "outline"}
                        disabled={isCurrentTheme}
                        style={!isCurrentTheme ? { 
                          background: theme.gradients.primary,
                          borderColor: theme.colors.primary,
                          color: 'white'
                        } : undefined}
                      >
                        {isCurrentTheme ? "Currently Active" : "Apply Theme"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>



          {/* Theme Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card>
              <CardContent className="p-6 text-center">
                <Palette className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Custom Colors</h4>
                <p className="text-sm text-gray-400">
                  Personalize every element with your favorite colors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Gamepad2 className="w-8 h-8 text-green-400 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Gaming Optimized</h4>
                <p className="text-sm text-gray-400">
                  Themes designed for optimal gaming performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Instant Preview</h4>
                <p className="text-sm text-gray-400">
                  See changes instantly without page reloads
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}