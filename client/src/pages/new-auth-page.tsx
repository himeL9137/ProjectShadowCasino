import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { AuthLanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/providers/LanguageProvider";
import { t } from "@/lib/i18n";

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
  const { language } = useLanguage();

  // Add effect to log language changes for debugging
  useEffect(() => {
    console.log('Current language in NewAuthPage:', language);
  }, [language]);

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
              {formType === "login" ? 
                (language === 'bn' ? 'লগইন' : 
                 language === 'es' ? 'Iniciar Sesión' : 
                 language === 'fr' ? 'Connexion' : 
                 language === 'de' ? 'Anmelden' : 
                 language === 'zh' ? '登录' : 
                 language === 'ja' ? 'ログイン' : 
                 language === 'ko' ? '로그인' : 
                 language === 'ar' ? 'تسجيل الدخول' : 
                 language === 'hi' ? 'लॉगिन' : 
                 language === 'ru' ? 'Вход' : 
                 language === 'pt' ? 'Entrar' : 'Login')
                : 
                (language === 'bn' ? 'নিবন্ধন' : 
                 language === 'es' ? 'Registrarse' : 
                 language === 'fr' ? 'S\'inscrire' : 
                 language === 'de' ? 'Registrieren' : 
                 language === 'zh' ? '注册' : 
                 language === 'ja' ? '登録' : 
                 language === 'ko' ? '회원가입' : 
                 language === 'ar' ? 'التسجيل' : 
                 language === 'hi' ? 'पंजीकरण' : 
                 language === 'ru' ? 'Регистрация' : 
                 language === 'pt' ? 'Registrar' : 'Register')
              }
            </h2>
            
            <div className="w-4/5">
              {formType === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4 w-full flex flex-col items-center">
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">
                      {language === 'bn' ? 'ব্যবহারকারীর নাম' : 
                       language === 'es' ? 'Nombre de Usuario' : 
                       language === 'fr' ? 'Nom d\'utilisateur' : 
                       language === 'de' ? 'Benutzername' : 
                       language === 'zh' ? '用户名' : 
                       language === 'ja' ? 'ユーザー名' : 
                       language === 'ko' ? '사용자명' : 
                       language === 'ar' ? 'اسم المستخدم' : 
                       language === 'hi' ? 'उपयोगकर्ता नाम' : 
                       language === 'ru' ? 'Имя пользователя' : 
                       language === 'pt' ? 'Nome de usuário' : 'Username'}
                    </label>
                    <input 
                      type="text"
                      className="auth-input w-full p-2 rounded"
                      placeholder={language === 'bn' ? 'ব্যবহারকারীর নাম' : 
                                  language === 'es' ? 'Nombre de Usuario' : 
                                  language === 'fr' ? 'Nom d\'utilisateur' : 
                                  language === 'de' ? 'Benutzername' : 
                                  language === 'zh' ? '用户名' : 
                                  language === 'ja' ? 'ユーザー名' : 
                                  language === 'ko' ? '사용자명' : 
                                  language === 'ar' ? 'اسم المستخدم' : 
                                  language === 'hi' ? 'उपयोगकर्ता नाम' : 
                                  language === 'ru' ? 'Имя пользователя' : 
                                  language === 'pt' ? 'Nome de usuário' : 'Username'}
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">
                      {language === 'bn' ? 'পাসওয়ার্ড' : 
                       language === 'es' ? 'Contraseña' : 
                       language === 'fr' ? 'Mot de passe' : 
                       language === 'de' ? 'Passwort' : 
                       language === 'zh' ? '密码' : 
                       language === 'ja' ? 'パスワード' : 
                       language === 'ko' ? '비밀번호' : 
                       language === 'ar' ? 'كلمة المرور' : 
                       language === 'hi' ? 'पासवर्ड' : 
                       language === 'ru' ? 'Пароль' : 
                       language === 'pt' ? 'Senha' : 'Password'}
                    </label>
                    <input 
                      type="password"
                      className="auth-input w-full p-2 rounded"
                      placeholder={language === 'bn' ? 'পাসওয়ার্ড' : 
                                  language === 'es' ? 'Contraseña' : 
                                  language === 'fr' ? 'Mot de passe' : 
                                  language === 'de' ? 'Passwort' : 
                                  language === 'zh' ? '密码' : 
                                  language === 'ja' ? 'パスワード' : 
                                  language === 'ko' ? '비밀번호' : 
                                  language === 'ar' ? 'كلمة المرور' : 
                                  language === 'hi' ? 'पासवर्ड' : 
                                  language === 'ru' ? 'Пароль' : 
                                  language === 'pt' ? 'Senha' : 'Password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="auth-button w-full p-3 border-none rounded text-white text-base cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? 
                      (language === 'bn' ? 'সাইন ইন করা হচ্ছে...' : 
                       language === 'es' ? 'Iniciando sesión...' : 
                       language === 'fr' ? 'Connexion...' : 
                       language === 'de' ? 'Anmelden...' : 
                       language === 'zh' ? '登录中...' : 
                       language === 'ja' ? 'ログイン中...' : 
                       language === 'ko' ? '로그인 중...' : 
                       language === 'ar' ? 'جاري تسجيل الدخول...' : 
                       language === 'hi' ? 'साइन इन हो रहा है...' : 
                       language === 'ru' ? 'Вход...' : 
                       language === 'pt' ? 'Entrando...' : 'Signing in...')
                      : 
                      (language === 'bn' ? 'সাইন ইন' : 
                       language === 'es' ? 'Iniciar Sesión' : 
                       language === 'fr' ? 'Se connecter' : 
                       language === 'de' ? 'Anmelden' : 
                       language === 'zh' ? '登录' : 
                       language === 'ja' ? 'ログイン' : 
                       language === 'ko' ? '로그인' : 
                       language === 'ar' ? 'تسجيل الدخول' : 
                       language === 'hi' ? 'साइन इन' : 
                       language === 'ru' ? 'Войти' : 
                       language === 'pt' ? 'Entrar' : 'Sign In')
                    }
                  </button>
                  {errorMessage && (
                    <p className="text-red-500 text-sm text-center">
                      {errorMessage}
                    </p>
                  )}
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4 w-full flex flex-col items-center">
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">{t('auth.username', language)}</label>
                    <input 
                      type="text"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.username', language)}
                      value={registerData.username}
                      onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">{t('auth.email', language)}</label>
                    <input 
                      type="email"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.email', language)}
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">{t('auth.phone', language)}</label>
                    <input 
                      type="tel"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.phone', language)}
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-white block mb-1 text-left">{t('auth.password', language)}</label>
                    <input 
                      type="password"
                      className="auth-input w-full p-2 rounded"
                      placeholder={t('auth.password', language)}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="auth-button w-full p-3 border-none rounded text-white text-base cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? `${t('auth.signup', language)}...` : t('auth.signup', language)}
                  </button>
                  {errorMessage && (
                    <p className="text-red-500 text-sm text-center">
                      {errorMessage}
                    </p>
                  )}
                </form>
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
                  {formType === "login" ? t('auth.switchToRegister', language) : t('auth.switchToLogin', language)}
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