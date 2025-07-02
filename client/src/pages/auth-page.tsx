import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { motion } from "framer-motion";
import { useLoading } from "@/hooks/use-loading";
const projectShadowLogo = "/assets/new-logo.png";

// Stars background component
function StarsBackground() {
  useEffect(() => {
    const stars: HTMLDivElement[] = [];
    const starsContainer = document.querySelector('.stars-container');
    
    if (starsContainer) {
      for (let i = 0; i < 500; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 10}s, ${Math.random() * 10}s`;
        starsContainer.appendChild(star);
        stars.push(star);
      }
    }

    return () => {
      stars.forEach(star => star.remove());
    };
  }, []);

  return <div className="stars-container fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0" />;
}

export function AuthPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [formType, setFormType] = useState<"login" | "register">("login");

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <>
      <style>{`
        .stars-container .star {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: twinkle 5s infinite, move 20s linear infinite;
          will-change: transform;
        }
        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 0.8; }
          100% { opacity: 0.3; }
        }
        @keyframes move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50vw, 50vh); }
        }
        @keyframes slideIn {
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        .new-auth-container {
          background: linear-gradient(135deg, #000, #1a0033);
        }
        .login-section {
          transform: translateY(20px);
          opacity: 0;
          animation: slideIn 0.5s ease-out forwards;
        }
        .info-section {
          opacity: 0;
          animation: fadeIn 0.5s ease-out 0.2s forwards;
        }
        .floating-logo {
          position: absolute;
          top: 20px;
          left: 20px;
          width: 35px;
          height: auto;
          transition: transform 0.3s ease;
          z-index: 10;
        }
        .floating-logo:hover {
          transform: rotate(10deg) scale(1.1);
        }
      `}</style>
      
      <div className="new-auth-container min-h-screen flex items-center justify-center overflow-hidden relative">
        <StarsBackground />
        
        <img 
          src={projectShadowLogo} 
          alt="Project Shadow Casino Logo" 
          className="floating-logo"
        />
        
        <div className="flex justify-between items-center w-4/5 max-w-6xl relative z-10 max-md:flex-col max-md:w-11/12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="login-section bg-black/70 p-8 rounded-xl w-2/5 max-md:w-full max-md:mb-8 flex flex-col items-center justify-center"
          >
            <h2 className="text-white text-2xl mb-6 text-center w-full">
              {formType === "login" ? "Member Login" : "Create Account"}
            </h2>
            
            <div className="w-4/5">
              {formType === "login" ? (
                <LoginForm 
                  onSuccess={() => setLocation("/")}
                  onSwitchToRegister={() => setFormType("register")}
                />
              ) : (
                <RegisterForm
                  onSuccess={() => setLocation("/")}
                  onSwitchToLogin={() => setFormType("login")}
                />
              )}
              
              <div className="flex justify-between mt-4 text-xs">
                <button 
                  className="text-[#6b48ff] hover:text-[#8a6aff] transition-colors cursor-pointer bg-transparent border-none"
                  onClick={() => {/* Handle forgot password */}}
                >
                  Forgot Password?
                </button>
                <button
                  className="text-[#6b48ff] hover:text-[#8a6aff] transition-colors cursor-pointer bg-transparent border-none"
                  onClick={() => setFormType(formType === "login" ? "register" : "login")}
                >
                  {formType === "login" ? "Create Account" : "Back to Login"}
                </button>
                <button 
                  className="text-[#6b48ff] hover:text-[#8a6aff] transition-colors cursor-pointer bg-transparent border-none"
                  onClick={() => {/* Handle help center */}}
                >
                  Help Center
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="info-section w-1/2 text-center max-md:w-full"
          >
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#6b48ff' }}>
              Project Shadow Casino
            </h1>
            <p className="text-gray-300 italic mb-8 text-lg">
              Where fortunes are made and legends are born. Experience the most exclusive high-stakes gaming platform in the universe.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="bg-black/70 p-4 rounded-lg">
                <div className="font-semibold text-white">Provably Fair</div>
                <div className="text-gray-300 text-sm">Blockchain-verified fairness on all games with transparent algorithms.</div>
              </div>
              <div className="bg-black/70 p-4 rounded-lg">
                <div className="font-semibold text-white">Instant Payouts</div>
                <div className="text-gray-300 text-sm">Withdraw your winnings instantly with no processing delays.</div>
              </div>
              <div className="bg-black/70 p-4 rounded-lg">
                <div className="font-semibold text-white">VIP Rewards</div>
                <div className="text-gray-300 text-sm">Exclusive bonuses and personalized service for high rollers.</div>
              </div>
            </div>
            
            <p className="text-gray-300">
              Join over 2.5 million players worldwide in the ultimate gaming experience.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}