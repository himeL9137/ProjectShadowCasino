import { useState, useEffect, memo, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/providers/LanguageProvider";

// Moving Stars Background Component with interaction-based disappearing
// Optimized with React.memo to prevent unnecessary re-renders
const MovingStarsBackground = memo(function MovingStarsBackground() {
  const [starsVisible, setStarsVisible] = useState(true);

  // Memoize the event handler to prevent unnecessary re-creations
  const handleUserInteraction = useCallback(() => {
    setTimeout(() => {
      setStarsVisible(false);
    }, 5000); // Hide after 5 seconds
  }, []);

  // Memoize the events array
  const interactionEvents = useMemo(() => 
    ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'], 
    []
  );

  useEffect(() => {
    const stars: HTMLDivElement[] = [];
    const starsContainer = document.querySelector('.home-stars-container');
    
    if (starsContainer && starsVisible) {
      // Create 500 stars for the home page (same as auth page)
      for (let i = 0; i < 500; i++) {
        const star = document.createElement('div');
        star.className = 'home-star';
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

    // Add event listeners for various user interactions
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      // Cleanup stars
      stars.forEach(star => star.remove());
      
      // Remove event listeners
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [starsVisible, handleUserInteraction, interactionEvents]);

  // Memoize the CSS styles to prevent recalculation
  const starStyles = useMemo(() => ({
    __html: `
      .home-star {
        position: absolute;
        background: white;
        border-radius: 50%;
        opacity: 0.6;
        animation: twinkle 10s infinite, float 20s infinite;
      }
      
      @keyframes twinkle {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      
      .home-star:nth-child(3n) { animation-duration: 15s, 25s; }
      .home-star:nth-child(3n+1) { animation-duration: 8s, 18s; }
      .home-star:nth-child(3n+2) { animation-duration: 12s, 22s; }
    `
  }), []);

  if (!starsVisible) return null;

  return (
    <div className="home-stars-container fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <style dangerouslySetInnerHTML={starStyles} />
    </div>
  );
});

export default function HomePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [winners, setWinners] = useState<any[]>([]);
  const [isLoadingWinners, setIsLoadingWinners] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [isDepositing, setIsDepositing] = useState(false);
  const { toast } = useToast();

  // Translation function for homepage with ALL languages
  const getText = (key: string) => {
    const translations: { [key: string]: { [lang: string]: string } } = {
      welcomeBack: { 
        en: 'Welcome back', bn: 'ফিরে আসার জন্য স্বাগতম', es: 'Bienvenido de vuelta', fr: 'Bon retour', de: 'Willkommen zurück', 
        zh: '欢迎回来', ja: 'おかえりなさい', ko: '환영합니다', ar: 'مرحباً بعودتك', hi: 'वापसी पर स्वागत है', ru: 'Добро пожаловать', 
        pt: 'Bem-vindo de volta', it: 'Bentornato', tr: 'Tekrar hoş geldiniz', nl: 'Welkom terug', th: 'ยินดีต้อนรับกลับ', 
        vi: 'Chào mừng trở lại', id: 'Selamat datang kembali', ms: 'Selamat kembali', pl: 'Witamy ponownie' 
      },
      balance: { 
        en: 'Balance', bn: 'ব্যালেন্স', es: 'Saldo', fr: 'Solde', de: 'Guthaben', zh: '余额', ja: '残高', ko: '잔액', 
        ar: 'الرصيد', hi: 'बैलेंस', ru: 'Баланс', pt: 'Saldo', it: 'Saldo', tr: 'Bakiye', nl: 'Saldo', th: 'ยอดเงิน', 
        vi: 'Số dư', id: 'Saldo', ms: 'Baki', pl: 'Saldo' 
      },
      quickActions: { 
        en: 'Quick Actions', bn: 'দ্রুত কার্যক্রম', es: 'Acciones Rápidas', fr: 'Actions Rapides', de: 'Schnellaktionen', 
        zh: '快速操作', ja: 'クイックアクション', ko: '빠른 작업', ar: 'الإجراءات السريعة', hi: 'त्वरित कार्य', ru: 'Быстрые действия', 
        pt: 'Ações Rápidas', it: 'Azioni Rapide', tr: 'Hızlı İşlemler', nl: 'Snelle Acties', th: 'การดำเนินการด่วน', 
        vi: 'Hành động nhanh', id: 'Tindakan Cepat', ms: 'Tindakan Pantas', pl: 'Szybkie Akcje' 
      },
      playNow: { 
        en: 'Play Now', bn: 'এখনই খেলুন', es: 'Jugar Ahora', fr: 'Jouer Maintenant', de: 'Jetzt Spielen', zh: '立即游戏', 
        ja: '今すぐプレイ', ko: '지금 플레이', ar: 'العب الآن', hi: 'अभी खेलें', ru: 'Играть сейчас', pt: 'Jogar Agora', 
        it: 'Gioca Ora', tr: 'Şimdi Oyna', nl: 'Speel Nu', th: 'เล่นเลย', vi: 'Chơi Ngay', id: 'Main Sekarang', 
        ms: 'Main Sekarang', pl: 'Graj Teraz' 
      },
      deposit: { 
        en: 'Deposit', bn: 'জমা', es: 'Depositar', fr: 'Dépôt', de: 'Einzahlen', zh: '存款', ja: '入金', ko: '입금', 
        ar: 'إيداع', hi: 'जमा', ru: 'Пополнить', pt: 'Depositar', it: 'Deposito', tr: 'Para Yatır', nl: 'Storten', 
        th: 'ฝากเงิน', vi: 'Nạp tiền', id: 'Setor', ms: 'Deposit', pl: 'Wpłata' 
      },
      withdraw: { 
        en: 'Withdraw', bn: 'উত্তোলন', es: 'Retirar', fr: 'Retirer', de: 'Abheben', zh: '提款', ja: '出金', ko: '출금', 
        ar: 'سحب', hi: 'निकालना', ru: 'Снять', pt: 'Sacar', it: 'Prelievo', tr: 'Para Çek', nl: 'Opnemen', 
        th: 'ถอนเงิน', vi: 'Rút tiền', id: 'Tarik', ms: 'Keluarkan', pl: 'Wypłata' 
      },
      recentWinners: { 
        en: 'Recent Winners', bn: 'সাম্প্রতিক বিজয়ী', es: 'Ganadores Recientes', fr: 'Gagnants Récents', de: 'Neueste Gewinner', 
        zh: '最近获奖者', ja: '最近の勝者', ko: '최근 우승자', ar: 'الفائزون الأخيرون', hi: 'हाल के विजेता', ru: 'Недавние победители', 
        pt: 'Vencedores Recentes', it: 'Vincitori Recenti', tr: 'Son Kazananlar', nl: 'Recente Winnaars', th: 'ผู้ชนะล่าสุด', 
        vi: 'Người thắng gần đây', id: 'Pemenang Terbaru', ms: 'Pemenang Terkini', pl: 'Najnowsi Zwycięzcy' 
      },
      noWinners: { 
        en: 'No recent winners', bn: 'সাম্প্রতিক কোন বিজয়ী নেই', es: 'No hay ganadores recientes', fr: 'Aucun gagnant récent', 
        de: 'Keine aktuellen Gewinner', zh: '暂无最近获奖者', ja: '最近の勝者はいません', ko: '최근 우승자 없음', ar: 'لا يوجد فائزون أخيرون', 
        hi: 'कोई हाल के विजेता नहीं', ru: 'Нет недавних победителей', pt: 'Nenhum vencedor recente', it: 'Nessun vincitore recente', 
        tr: 'Yakın zamanda kazanan yok', nl: 'Geen recente winnaars', th: 'ไม่มีผู้ชนะล่าสุด', vi: 'Không có người thắng gần đây', 
        id: 'Tidak ada pemenang terbaru', ms: 'Tiada pemenang terkini', pl: 'Brak najnowszych zwycięzców' 
      },
      won: { 
        en: 'won', bn: 'জিতেছে', es: 'ganó', fr: 'a gagné', de: 'gewann', zh: '赢得', ja: '勝利', ko: '승리', ar: 'فاز', 
        hi: 'जीता', ru: 'выиграл', pt: 'ganhou', it: 'ha vinto', tr: 'kazandı', nl: 'won', th: 'ชนะ', vi: 'thắng', 
        id: 'menang', ms: 'menang', pl: 'wygrał' 
      },
      welcomeToShadowCasino: {
        en: 'Welcome to Shadow Casino', bn: 'শ্যাডো ক্যাসিনোতে স্বাগতম', es: 'Bienvenido a Shadow Casino', fr: 'Bienvenue au Shadow Casino', 
        de: 'Willkommen im Shadow Casino', zh: '欢迎来到Shadow Casino', ja: 'Shadow Casinoへようこそ', ko: 'Shadow Casino에 오신 것을 환영합니다', 
        ar: 'مرحباً بكم في كازينو الظل', hi: 'शैडो कैसीनो में आपका स्वागत है', ru: 'Добро пожаловать в Shadow Casino', pt: 'Bem-vindo ao Shadow Casino', 
        it: 'Benvenuto a Shadow Casino', tr: 'Shadow Casino\'ya Hoş Geldiniz', nl: 'Welkom bij Shadow Casino', th: 'ยินดีต้อนรับสู่ Shadow Casino', 
        vi: 'Chào mừng đến với Shadow Casino', id: 'Selamat datang di Shadow Casino', ms: 'Selamat datang ke Shadow Casino', pl: 'Witamy w Shadow Casino'
      },
      casinoDescription: {
        en: 'Experience the thrill of our premium casino games with cutting-edge design and exciting rewards.',
        bn: 'অত্যাধুনিক ডিজাইন এবং রোমাঞ্চকর পুরস্কার সহ আমাদের প্রিমিয়াম ক্যাসিনো গেমের রোমাঞ্চ অনুভব করুন।',
        es: 'Experimenta la emoción de nuestros juegos de casino premium con diseño vanguardista y recompensas emocionantes.',
        fr: 'Découvrez le frisson de nos jeux de casino premium avec un design avant-gardiste et des récompenses passionnantes.',
        de: 'Erleben Sie den Nervenkitzel unserer Premium-Casino-Spiele mit modernster Technik und aufregenden Belohnungen.',
        zh: '体验我们优质赌场游戏的刺激，拥有前沿设计和令人兴奋的奖励。',
        ja: '最先端のデザインとエキサイティングな報酬で、プレミアムカジノゲームのスリルを体験してください。',
        ko: '최첨단 디자인과 흥미진진한 보상으로 프리미엄 카지노 게임의 스릴을 경험하세요.',
        ar: 'اختبر إثارة ألعاب الكازينو المتميزة مع التصميم المتطور والمكافآت المثيرة.',
        hi: 'अत्याधुनिक डिज़ाइन और रोमांचक पुरस्कारों के साथ हमारे प्रीमियम कैसीनो गेम्स का रोमांच अनुभव करें।',
        ru: 'Испытайте волнение от наших премиальных казино игр с передовым дизайном и захватывающими наградами.',
        pt: 'Experimente a emoção dos nossos jogos de casino premium com design inovador e recompensas emocionantes.',
        it: 'Vivi l\'emozione dei nostri giochi di casinò premium con design all\'avanguardia e ricompense entusiasmanti.',
        tr: 'Son teknoloji tasarım ve heyecan verici ödüllerle premium casino oyunlarımızın heyecanını yaşayın.',
        nl: 'Ervaar de spanning van onze premium casinogames met geavanceerd ontwerp en opwindende beloningen.',
        th: 'สัมผัสความตื่นเต้นของเกมคาสิโนพรีเมียมของเราด้วยการออกแบบที่ทันสมัยและรางวัลที่น่าตื่นเต้น',
        vi: 'Trải nghiệm cảm giác hồi hộp của các trò chơi casino cao cấp với thiết kế tiên tiến và phần thưởng thú vị.',
        id: 'Rasakan sensasi permainan kasino premium kami dengan desain canggih dan hadiah yang menarik.',
        ms: 'Alami keseronokan permainan kasino premium kami dengan reka bentuk canggih dan ganjaran yang menarik.',
        pl: 'Doświadcz emocji naszych gier kasynowych premium z nowoczesnym designem i ekscytującymi nagrodami.'
      }
    };
    return translations[key]?.[language] || translations[key]?.['en'] || key;
  };

  // Get currency symbol based on user's selected currency
  const getCurrencySymbol = (currency: string = 'USD') => {
    switch(currency) {
      case 'USD': return '$';
      case 'BDT': return '৳';
      case 'INR': return '₹';
      case 'BTC': return '₿';
      default: return '$';
    }
  };

  // Format money values
  const formatMoney = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // Load recent winners data
  useEffect(() => {
    const fetchWinners = async () => {
      setIsLoadingWinners(true);
      try {
        const response = await fetch('/api/games/winners?limit=3');
        if (!response.ok) throw new Error('Failed to fetch winners');
        const data = await response.json();
        setWinners(data);
      } catch (error) {
        console.error('Error fetching winners:', error);
      } finally {
        setIsLoadingWinners(false);
      }
    };

    fetchWinners();
  }, []);

  // Handle deposit
  const handleDeposit = async () => {
    if (depositAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive amount to deposit",
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);
    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: depositAmount,
          currency: user?.currency || 'USD'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deposit funds');
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Deposit Successful",
          description: `${getCurrencySymbol(user?.currency)}${formatMoney(depositAmount)} has been added to your account.`,
          variant: "default",
        });
      } else {
        // If it returned WhatsApp info
        toast({
          title: "WhatsApp Deposit",
          description: "Please contact the provided WhatsApp number to complete your deposit.",
          variant: "default",
        });
      }

      // Force reload after successful deposit
      window.location.reload();

    } catch (err) {
      toast({
        title: "Deposit Failed",
        description: err instanceof Error ? err.message : "An error occurred during deposit",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <>
      {/* Add moving stars CSS styles (same as auth page) */}
      <style>{`
        .home-stars-container .home-star {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: home-twinkle 5s infinite, home-move 20s linear infinite;
          will-change: transform;
        }
        @keyframes home-twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 0.8; }
          100% { opacity: 0.3; }
        }
        @keyframes home-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50vw, 50vh); }
        }
      `}</style>
      
      <MovingStarsBackground />
      
      <MainLayout>
      <div className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {getText('welcomeToShadowCasino')}
              </h2>          
              <div className="text-gray-300 max-w-4xl">
                <p>
                  {getText('casinoDescription')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Slots Card */}
            <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 aspect-[4/3] flex items-center justify-center text-center p-6 relative overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-3 gap-2 h-full">
                    <div className="bg-yellow-400 rounded animate-pulse"></div>
                    <div className="bg-red-500 rounded animate-pulse delay-100"></div>
                    <div className="bg-green-500 rounded animate-pulse delay-200"></div>
                    <div className="bg-blue-500 rounded animate-pulse delay-300"></div>
                    <div className="bg-purple-500 rounded animate-pulse delay-400"></div>
                    <div className="bg-pink-500 rounded animate-pulse delay-500"></div>
                    <div className="bg-orange-500 rounded animate-pulse delay-75"></div>
                    <div className="bg-teal-500 rounded animate-pulse delay-150"></div>
                    <div className="bg-cyan-500 rounded animate-pulse delay-250"></div>
                  </div>
                </div>
                {/* Slot machine visual */}
                <div className="relative z-10">
                  <div className="text-6xl mb-2">🎰</div>
                  <div className="flex justify-center space-x-1 text-2xl">
                    <span className="animate-bounce">🍒</span>
                    <span className="animate-bounce delay-100">💎</span>
                    <span className="animate-bounce delay-200">🍀</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-primary/20 text-primary rounded-md px-2">
                  <span className="text-sm font-medium">Popular</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold">Slots</h3>
                <p className="text-gray-400 text-sm mt-1 mb-3">Classic 3x3 slots machine. Spin to win up to 20x your bet!</p>
                <Link href="/slots">
                  <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors">
                    Play Now
                  </button>
                </Link>
              </div>
            </div>

            {/* Dice Card */}
            <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 aspect-[4/3] flex items-center justify-center text-center p-6 relative overflow-hidden">
                {/* Dice dots pattern background */}
                <div className="absolute inset-0 opacity-10">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>
                {/* Dice visual */}
                <div className="relative z-10">
                  <div className="text-6xl mb-2 animate-bounce">🎲</div>
                  <div className="flex justify-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded border-2 border-gray-300 flex items-center justify-center text-black font-bold">6</div>
                    <div className="text-2xl text-yellow-400">vs</div>
                    <div className="w-8 h-8 bg-white rounded border-2 border-gray-300 flex items-center justify-center text-black font-bold">50</div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold">Dice</h3>
                <p className="text-gray-400 text-sm mt-1 mb-3">Over/Under dice game. Choose your odds, place your bet!</p>
                <Link href="/dice">
                  <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors">
                    Play Now
                  </button>
                </Link>
              </div>
            </div>

            {/* Plinko Master Card */}
            <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="bg-gradient-to-br from-purple-900 via-indigo-800 to-violet-900 aspect-[4/3] flex items-center justify-center text-center p-6 relative overflow-hidden">
                {/* Advanced plinko pattern */}
                <div className="absolute inset-0 opacity-30">
                  {Array.from({ length: 6 }).map((_, row) => (
                    <div key={row} className="flex justify-center mb-1" style={{ paddingLeft: `${(row % 2) * 8}px` }}>
                      {Array.from({ length: Math.min(8 - Math.floor(row / 2), 6) }).map((_, pin) => (
                        <div
                          key={pin}
                          className="w-1.5 h-1.5 bg-white rounded-full mx-1 animate-pulse"
                          style={{ animationDelay: `${(row * 100 + pin * 50)}ms` }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                {/* Plinko Master visual */}
                <div className="relative z-10">
                  <div className="text-6xl mb-2 animate-bounce">🟠</div>
                  <div className="flex justify-center space-x-px text-xs">
                    <div className="bg-red-500 px-1 rounded">2.0x</div>
                    <div className="bg-orange-500 px-1 rounded">1.8x</div>
                    <div className="bg-yellow-500 px-1 rounded">1.6x</div>
                    <div className="bg-green-500 px-1 rounded">1.4x</div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-purple-500/30 text-purple-200 rounded-md px-2">
                  <span className="text-sm font-medium">New</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold">Plinko</h3>
                <p className="text-gray-400 text-sm mt-1 mb-3">Advanced plinko with dynamic physics and 16 slots!</p>
                <Link href="/plinko_master">
                  <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors">
                    Play Now
                  </button>
                </Link>
              </div>
            </div>
          </div>

          

          <div className="bg-card rounded-lg p-6">
            <h3 className="text-lg font-bold mb-2">Join the Casino Community</h3>
            <p className="text-gray-400 mb-4">Connect with thousands of players already winning on Shadow Casino. Register now and claim your welcome bonus!</p>

            <div className="flex items-center gap-4">
              <Link href="/chat">
                <button className="bg-background px-4 py-2 rounded-md hover:bg-muted transition-colors">
                  Chat Room
                </button>
              </Link>
              <a 
                href="https://wa.me/01989379895" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-background px-4 py-2 rounded-md hover:bg-muted transition-colors inline-flex items-center gap-2"
              >
                <span className="text-green-500 text-xl">✆</span>
                <span>Support</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
    </>
  );
}