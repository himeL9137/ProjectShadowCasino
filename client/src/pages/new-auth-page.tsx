import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { AuthLanguageSelector } from "@/components/ui/language-selector";
import { useTranslation } from "@/providers/LanguageProvider";

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

export default function NewAuthPage() {
  const [formType, setFormType] = useState<"login" | "register">("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login, register, isLoading, error, user } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    phone: ""
  });

  // Set error messages from auth context
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await login(loginData);
    } catch (error) {
      // Error handling is done in auth context
    }
  };

  // Handle register form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await register(registerData);
    } catch (error) {
      // Error handling is done in auth context
    }
  };

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
        .auth-input {
          background: #333 !important;
          border: none !important;
          color: #fff !important;
          transition: background 0.3s ease;
        }
        .auth-input:focus {
          background: #444 !important;
        }
        .auth-button {
          background: #6b48ff !important;
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .auth-button:hover {
          transform: scale(1.05);
          background: #8a6aff !important;
        }
      `}</style>
      
      <div className="new-auth-container min-h-screen flex items-center justify-center overflow-hidden relative">
        <StarsBackground />
        
        <img 
          src={projectShadowLogo} 
          alt="Project Shadow Casino Logo" 
          className="floating-logo"
        />
        
        {/* Language Selector */}
        <div className="absolute top-5 right-5 z-20">
          <AuthLanguageSelector />
        </div>
        
        <div className="flex justify-between items-center w-4/5 max-w-6xl relative z-10 max-md:flex-col max-md:w-11/12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="login-section bg-black/70 p-8 rounded-xl w-2/5 max-md:w-full max-md:mb-8 flex flex-col items-center justify-center"
          >
            <h2 className="text-white text-2xl mb-6 text-center w-full">
              {formType === "login" ? t('auth.login') : t('auth.register')}
            </h2>
            
            <div className="w-4/5">
              {formType === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4 w-full flex flex-col items-center">
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">
                      {t('auth.username')}
                    </label>
                    <input 
                      type="text"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.username')}
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">
                      {t('auth.password')}
                    </label>
                    <input 
                      type="password"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.password')}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="auth-button text-white px-6 py-2 rounded w-2/3"
                    disabled={isLoading}
                  >
                    {isLoading ? t('ui.loading') : t('auth.signin')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4 w-full flex flex-col items-center">
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">
                      {t('auth.username')}
                    </label>
                    <input 
                      type="text"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.username')}
                      value={registerData.username}
                      onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">
                      {t('auth.email')}
                    </label>
                    <input 
                      type="email"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.email')}
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">
                      {t('auth.password')}
                    </label>
                    <input 
                      type="password"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.password')}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">
                      {t('auth.phone')}
                    </label>
                    <input 
                      type="tel"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.phone')}
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="auth-button text-white px-6 py-2 rounded w-2/3"
                    disabled={isLoading}
                  >
                    {isLoading ? t('ui.loading') : t('auth.signup')}
                  </button>
                </form>
              )}
              
              {errorMessage && (
                <div className="text-red-500 text-center mt-4">
                  {errorMessage}
                </div>
              )}
              
              <p className="text-white/70 text-sm text-center mt-6">
                {formType === "login" ? (
                  <>
                    {t('auth.switchToRegister')}{' '}
                    <button
                      type="button"
                      onClick={() => setFormType("register")}
                      className="text-white underline hover:no-underline"
                    >
                      {t('auth.signup')}
                    </button>
                  </>
                ) : (
                  <>
                    {t('auth.switchToLogin')}{' '}
                    <button
                      type="button"
                      onClick={() => setFormType("login")}
                      className="text-white underline hover:no-underline"
                    >
                      {t('auth.signin')}
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="info-section text-white text-left w-1/2 max-md:w-full max-md:text-center"
          >
            <h1 className="text-6xl font-bold mb-4">{t('auth.welcome')}</h1>
            <p className="text-2xl text-white/70">{t('auth.subtitle')}</p>
          </motion.div>
        </div>
      </div>
    </>
  );
}