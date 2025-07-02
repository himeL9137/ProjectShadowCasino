import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice1, TrendingUp, Users, Shield } from "lucide-react";

// Interactive Stars Background Component
function InteractiveStarsBackground() {
  const [starsVisible, setStarsVisible] = useState(true);

  useEffect(() => {
    const stars: HTMLDivElement[] = [];
    const starsContainer = document.querySelector('.landing-stars-container');
    
    if (starsContainer && starsVisible) {
      // Create 400 stars for the landing page
      for (let i = 0; i < 400; i++) {
        const star = document.createElement('div');
        star.className = 'landing-star';
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 8}s, ${Math.random() * 15}s`;
        starsContainer.appendChild(star);
        stars.push(star);
      }
    }

    // Mouse and interaction event handlers
    const handleUserInteraction = () => {
      setStarsVisible(false);
    };

    // Add event listeners for various user interactions
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction);
    });

    return () => {
      // Cleanup stars
      stars.forEach(star => star.remove());
      
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [starsVisible]);

  if (!starsVisible) return null;

  return <div className="landing-stars-container fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0" />;
}

export default function Landing() {
  return (
    <>
      {/* Add stars CSS styles */}
      <style>{`
        .landing-stars-container .landing-star {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: landing-twinkle 3s infinite, landing-move 20s linear infinite;
          will-change: transform, opacity;
        }
        @keyframes landing-twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        @keyframes landing-move {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30vw, 15vh) rotate(90deg); }
          50% { transform: translate(60vw, 35vh) rotate(180deg); }
          75% { transform: translate(90vw, 25vh) rotate(270deg); }
          100% { transform: translate(120vw, 45vh) rotate(360deg); }
        }
      `}</style>
      
      <InteractiveStarsBackground />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative z-10">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Shadow Casino
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            The ultimate gaming experience with real-time features and multi-currency support
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
          >
            Sign In with Replit
          </Button>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <Dice1 className="w-12 h-12 text-purple-400 mx-auto mb-2" />
              <CardTitle className="text-white">Multiple Games</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center">
                Enjoy Plinko, Number Guessing, and custom HTML games
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <CardTitle className="text-white">Multi-Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center">
                Support for 25+ currencies including USD, BDT, BTC, and more
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <CardTitle className="text-white">Real-time Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center">
                Connect with other players through live WebSocket chat
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
              <CardTitle className="text-white">Secure Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center">
                Secure authentication and transaction management
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Playing?
          </h2>
          <p className="text-gray-300 mb-6">
            Sign in with your Replit account to access all features
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}