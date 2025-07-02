// Language configuration and translation system

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' }
];

export const DEFAULT_LANGUAGE = 'en';

// Translation keys and their default English values
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Auth page
    'auth.welcome': 'Welcome to Project Shadow',
    'auth.subtitle': 'The Ultimate Gaming Experience',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.username': 'Username',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.phone': 'Phone',
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.languageSelector': 'Select Language',
    'auth.switchToLogin': 'Already have an account? Sign in',
    'auth.switchToRegister': 'Don\'t have an account? Sign up',
    
    // Navigation
    'nav.home': 'Home',
    'nav.games': 'Games',
    'nav.dice': 'Dice',
    'nav.plinko': 'Plinko',
    'nav.slots': 'Slots',
    'nav.wallet': 'Wallet',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'nav.referrals': 'Referrals',
    'nav.chat': 'Chat',
    'nav.support': 'Support',
    'nav.logout': 'Logout',
    'nav.leaderboard': 'Leaderboard',
    'nav.themes': 'Themes',
    'nav.currency': 'Currency',
    'nav.transactions': 'Transactions',
    'nav.settings': 'Settings',
    
    // Games
    'games.title': 'Games',
    'games.backToGames': 'Back to Games',
    'games.placeYourBet': 'Place Your Bet',
    'games.betAmount': 'Bet Amount',
    'games.betSettings': 'Bet Settings',
    'games.balance': 'Balance',
    'games.minBet': 'Min Bet',
    'games.maxBet': 'Max Bet',
    'games.winChance': 'Win Chance',
    'games.multiplier': 'Multiplier',
    'games.payoutOnWin': 'Payout on Win',
    'games.playing': 'Playing...',
    'games.rollDice': 'Roll Dice',
    'games.dropBall': 'Drop Ball',
    'games.spinReels': 'Spin Reels',
    'games.gameResult': 'Game Result',
    'games.youWon': 'You Won!',
    'games.youLost': 'You Lost',
    'games.credits': 'Credits',
    
    // Dice Game
    'dice.title': 'Dice Game',
    'dice.prediction': 'Prediction',
    'dice.rollOver': 'Roll Over',
    'dice.rollUnder': 'Roll Under',
    'dice.result': 'Result',
    'dice.rolling': 'Rolling...',
    
    // Plinko Game
    'plinko.title': 'Plinko Game',
    'plinko.dropping': 'Dropping...',
    'plinko.ballLanded': 'Ball Landed',
    
    // Wallet
    'wallet.title': 'Wallet',
    'wallet.currentBalance': 'Current Balance',
    'wallet.deposit': 'Deposit',
    'wallet.withdraw': 'Withdraw',
    'wallet.transactionHistory': 'Transaction History',
    'wallet.paymentMethods': 'Payment Methods',
    
    // Referrals
    'referrals.title': 'Referral Program',
    'referrals.inviteFriends': 'Invite Friends',
    'referrals.yourCode': 'Your Referral Code',
    'referrals.shareCode': 'Share this code with friends',
    'referrals.generateNew': 'Generate New Code',
    'referrals.totalEarnings': 'Total Earnings',
    'referrals.totalReferrals': 'Total Referrals',
    'referrals.copyCode': 'Copy Code',
    'referrals.codeCopied': 'Code copied to clipboard!',
    
    // Profile
    'profile.title': 'Profile',
    'profile.username': 'Username',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.currency': 'Currency',
    'profile.joinDate': 'Join Date',
    'profile.save': 'Save Changes',
    'profile.changePassword': 'Change Password',
    'profile.uploadPhoto': 'Upload Photo',
    
    // Admin
    'admin.title': 'Admin Panel',
    'admin.users': 'Users',
    'admin.transactions': 'Transactions',
    'admin.games': 'Games',
    'admin.settings': 'Settings',
    'admin.ban': 'Ban',
    'admin.unban': 'Unban',
    'admin.mute': 'Mute',
    'admin.unmute': 'Unmute',
    
    // Common UI
    'ui.save': 'Save',
    'ui.cancel': 'Cancel',
    'ui.delete': 'Delete',
    'ui.edit': 'Edit',
    'ui.add': 'Add',
    'ui.close': 'Close',
    'ui.confirm': 'Confirm',
    'ui.loading': 'Loading...',
    'ui.error': 'Error',
    'ui.success': 'Success',
    'ui.warning': 'Warning',
    'ui.info': 'Information',
    'ui.yes': 'Yes',
    'ui.no': 'No',
    'ui.search': 'Search',
    'ui.filter': 'Filter',
    'ui.sort': 'Sort',
    'ui.view': 'View',
    'ui.back': 'Back',
    'ui.next': 'Next',
    'ui.previous': 'Previous',
    'ui.submit': 'Submit',
    'ui.reset': 'Reset',
    'ui.clear': 'Clear',
    'ui.select': 'Select',
    'ui.upload': 'Upload',
    'ui.download': 'Download',
    'ui.copy': 'Copy',
    'ui.paste': 'Paste',
    'ui.cut': 'Cut',
    'ui.undo': 'Undo',
    'ui.redo': 'Redo',
    
    // Messages
    'messages.welcome': 'Welcome to Project Shadow Casino!',
    'messages.loginSuccess': 'Login successful!',
    'messages.loginFailed': 'Login failed. Please check your credentials.',
    'messages.registerSuccess': 'Registration successful!',
    'messages.registerFailed': 'Registration failed. Please try again.',
    'messages.betPlaced': 'Bet placed successfully!',
    'messages.betFailed': 'Failed to place bet. Please try again.',
    'messages.insufficientBalance': 'Insufficient balance.',
    'messages.gameWin': 'Congratulations! You won!',
    'messages.gameLoss': 'Better luck next time!',
    'messages.profileUpdated': 'Profile updated successfully!',
    'messages.passwordChanged': 'Password changed successfully!',
    'messages.codeGenerated': 'New referral code generated!',
    'messages.invalidInput': 'Invalid input. Please check your data.',
    'messages.networkError': 'Network error. Please check your connection.',
    'messages.serverError': 'Server error. Please try again later.',
  },
  
  // Bengali translations
  bn: {
    // Auth page
    'auth.welcome': 'প্রজেক্ট শ্যাডোতে স্বাগতম',
    'auth.subtitle': 'চূড়ান্ত গেমিং অভিজ্ঞতা',
    'auth.login': 'লগইন',
    'auth.register': 'নিবন্ধন',
    'auth.username': 'ব্যবহারকারীর নাম',
    'auth.email': 'ইমেইল',
    'auth.password': 'পাসওয়ার্ড',
    'auth.phone': 'ফোন',
    'auth.signin': 'সাইন ইন',
    'auth.signup': 'সাইন আপ',
    'auth.languageSelector': 'ভাষা নির্বাচন করুন',
    'auth.switchToLogin': 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে? সাইন ইন করুন',
    'auth.switchToRegister': 'কোন অ্যাকাউন্ট নেই? সাইন আপ করুন',
    
    // Navigation
    'nav.home': 'হোম',
    'nav.games': 'গেমস',
    'nav.dice': 'ডাইস',
    'nav.plinko': 'প্লিঙ্কো',
    'nav.slots': 'স্লটস',
    'nav.wallet': 'ওয়ালেট',
    'nav.profile': 'প্রোফাইল',
    'nav.admin': 'অ্যাডমিন',
    'nav.referrals': 'রেফারেল',
    'nav.chat': 'চ্যাট',
    'nav.support': 'সাপোর্ট',
    'nav.logout': 'লগআউট',
    'nav.leaderboard': 'লিডারবোর্ড',
    'nav.themes': 'থিম',
    'nav.currency': 'মুদ্রা',
    'nav.transactions': 'লেনদেন',
    'nav.settings': 'সেটিংস',
    
    // Games
    'games.title': 'গেমস',
    'games.backToGames': 'গেমসে ফিরে যান',
    'games.placeYourBet': 'আপনার বাজি রাখুন',
    'games.betAmount': 'বাজির পরিমাণ',
    'games.betSettings': 'বাজি সেটিংস',
    'games.balance': 'ব্যালেন্স',
    'games.minBet': 'সর্বনিম্ন বাজি',
    'games.maxBet': 'সর্বোচ্চ বাজি',
    'games.winChance': 'জেতার সম্ভাবনা',
    'games.multiplier': 'মাল্টিপ্লায়ার',
    'games.payoutOnWin': 'জয়ে পেআউট',
    'games.playing': 'খেলা হচ্ছে...',
    'games.rollDice': 'ডাইস রোল করুন',
    'games.dropBall': 'বল ড্রপ করুন',
    'games.spinReels': 'রিল স্পিন করুন',
    'games.gameResult': 'গেমের ফলাফল',
    'games.youWon': 'আপনি জিতেছেন!',
    'games.youLost': 'আপনি হেরেছেন',
    'games.credits': 'ক্রেডিট',
    
    // Dice Game
    'dice.title': 'ডাইস গেম',
    'dice.prediction': 'পূর্বাভাস',
    'dice.rollOver': 'উপরে রোল',
    'dice.rollUnder': 'নিচে রোল',
    'dice.result': 'ফলাফল',
    'dice.rolling': 'রোল হচ্ছে...',
    
    // Plinko Game
    'plinko.title': 'প্লিঙ্কো গেম',
    'plinko.dropping': 'ড্রপ হচ্ছে...',
    'plinko.ballLanded': 'বল ল্যান্ড করেছে',
    
    // Wallet
    'wallet.title': 'ওয়ালেট',
    'wallet.currentBalance': 'বর্তমান ব্যালেন্স',
    'wallet.deposit': 'জমা',
    'wallet.withdraw': 'উত্তোলন',
    'wallet.transactionHistory': 'লেনদেনের ইতিহাস',
    'wallet.paymentMethods': 'পেমেন্ট পদ্ধতি',
    
    // Referrals
    'referrals.title': 'রেফারেল প্রোগ্রাম',
    'referrals.inviteFriends': 'বন্ধুদের আমন্ত্রণ জানান',
    'referrals.yourCode': 'আপনার রেফারেল কোড',
    'referrals.shareCode': 'বন্ধুদের সাথে এই কোড শেয়ার করুন',
    'referrals.generateNew': 'নতুন কোড তৈরি করুন',
    'referrals.totalEarnings': 'মোট আয়',
    'referrals.totalReferrals': 'মোট রেফারেল',
    'referrals.copyCode': 'কোড কপি করুন',
    'referrals.codeCopied': 'কোড ক্লিপবোর্ডে কপি হয়েছে!',
    
    // Profile
    'profile.title': 'প্রোফাইল',
    'profile.username': 'ব্যবহারকারীর নাম',
    'profile.email': 'ইমেইল',
    'profile.phone': 'ফোন',
    'profile.currency': 'মুদ্রা',
    'profile.joinDate': 'যোগদানের তারিখ',
    'profile.save': 'পরিবর্তন সংরক্ষণ করুন',
    'profile.changePassword': 'পাসওয়ার্ড পরিবর্তন করুন',
    'profile.uploadPhoto': 'ছবি আপলোড করুন',
    
    // Admin
    'admin.title': 'অ্যাডমিন প্যানেল',
    'admin.users': 'ব্যবহারকারীরা',
    'admin.transactions': 'লেনদেন',
    'admin.games': 'গেমস',
    'admin.settings': 'সেটিংস',
    'admin.ban': 'নিষিদ্ধ',
    'admin.unban': 'নিষেধাজ্ঞা তুলুন',
    'admin.mute': 'নিঃশব্দ',
    'admin.unmute': 'আনমিউট',
    
    // Common UI
    'ui.save': 'সংরক্ষণ',
    'ui.cancel': 'বাতিল',
    'ui.delete': 'মুছুন',
    'ui.edit': 'সম্পাদনা',
    'ui.add': 'যোগ করুন',
    'ui.close': 'বন্ধ করুন',
    'ui.confirm': 'নিশ্চিত করুন',
    'ui.loading': 'লোড হচ্ছে...',
    'ui.error': 'ত্রুটি',
    'ui.success': 'সফল',
    'ui.warning': 'সতর্কতা',
    'ui.info': 'তথ্য',
    'ui.yes': 'হ্যাঁ',
    'ui.no': 'না',
    'ui.search': 'অনুসন্ধান',
    'ui.filter': 'ফিল্টার',
    'ui.sort': 'সাজান',
    'ui.view': 'দেখুন',
    'ui.back': 'পিছনে',
    'ui.next': 'পরবর্তী',
    'ui.previous': 'পূর্ববর্তী',
    'ui.submit': 'জমা দিন',
    'ui.reset': 'রিসেট',
    'ui.clear': 'পরিষ্কার',
    'ui.select': 'নির্বাচন করুন',
    'ui.upload': 'আপলোড',
    'ui.download': 'ডাউনলোড',
    'ui.copy': 'কপি',
    'ui.paste': 'পেস্ট',
    'ui.cut': 'কাট',
    'ui.undo': 'পূর্বাবস্থা',
    'ui.redo': 'পুনরায় করুন',
    
    // Messages
    'messages.welcome': 'প্রজেক্ট শ্যাডো ক্যাসিনোতে স্বাগতম!',
    'messages.loginSuccess': 'লগইন সফল হয়েছে!',
    'messages.loginFailed': 'লগইন ব্যর্থ। আপনার পরিচয়পত্র পরীক্ষা করুন।',
    'messages.registerSuccess': 'নিবন্ধন সফল হয়েছে!',
    'messages.registerFailed': 'নিবন্ধন ব্যর্থ। আবার চেষ্টা করুন।',
    'messages.betPlaced': 'বাজি সফলভাবে রাখা হয়েছে!',
    'messages.betFailed': 'বাজি রাখতে ব্যর্থ। আবার চেষ্টা করুন।',
    'messages.insufficientBalance': 'অপর্যাপ্ত ব্যালেন্স।',
    'messages.gameWin': 'অভিনন্দন! আপনি জিতেছেন!',
    'messages.gameLoss': 'পরের বার ভাল হোক!',
    'messages.profileUpdated': 'প্রোফাইল সফলভাবে আপডেট হয়েছে!',
    'messages.passwordChanged': 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!',
    'messages.codeGenerated': 'নতুন রেফারেল কোড তৈরি হয়েছে!',
    'messages.invalidInput': 'অবৈধ ইনপুট। আপনার ডেটা পরীক্ষা করুন।',
    'messages.networkError': 'নেটওয়ার্ক ত্রুটি। আপনার সংযোগ পরীক্ষা করুন।',
    'messages.serverError': 'সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।',
  },
  
  // Spanish translations
  es: {
    // Auth page
    'auth.welcome': 'Bienvenido a Project Shadow',
    'auth.subtitle': 'La Experiencia de Juego Definitiva',
    'auth.login': 'Iniciar sesión',
    'auth.register': 'Registrarse',
    'auth.username': 'Nombre de usuario',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.phone': 'Teléfono',
    'auth.signin': 'Entrar',
    'auth.signup': 'Registrarse',
    'auth.languageSelector': 'Seleccionar idioma',
    'auth.switchToLogin': '¿Ya tienes una cuenta? Inicia sesión',
    'auth.switchToRegister': '¿No tienes cuenta? Regístrate',
    
    // Navigation
    'nav.home': 'Inicio',
    'nav.games': 'Juegos',
    'nav.dice': 'Dados',
    'nav.plinko': 'Plinko',
    'nav.slots': 'Tragamonedas',
    'nav.wallet': 'Billetera',
    'nav.profile': 'Perfil',
    'nav.admin': 'Admin',
    'nav.referrals': 'Referencias',
    'nav.chat': 'Chat',
    'nav.support': 'Soporte',
    'nav.logout': 'Cerrar sesión',
    'nav.leaderboard': 'Clasificación',
    'nav.themes': 'Temas',
    'nav.currency': 'Moneda',
    'nav.transactions': 'Transacciones',
    'nav.settings': 'Configuración',
    
    // Games
    'games.title': 'Juegos',
    'games.backToGames': 'Volver a Juegos',
    'games.placeYourBet': 'Haz tu apuesta',
    'games.betAmount': 'Cantidad de apuesta',
    'games.betSettings': 'Configuración de apuesta',
    'games.balance': 'Saldo',
    'games.minBet': 'Apuesta mínima',
    'games.maxBet': 'Apuesta máxima',
    'games.winChance': 'Probabilidad de ganar',
    'games.multiplier': 'Multiplicador',
    'games.payoutOnWin': 'Pago al ganar',
    'games.playing': 'Jugando...',
    'games.rollDice': 'Tirar dados',
    'games.dropBall': 'Soltar bola',
    'games.spinReels': 'Girar carretes',
    'games.gameResult': 'Resultado del juego',
    'games.youWon': '¡Ganaste!',
    'games.youLost': 'Perdiste',
    'games.credits': 'Créditos',
    
    // UI
    'ui.save': 'Guardar',
    'ui.cancel': 'Cancelar',
    'ui.delete': 'Eliminar',
    'ui.edit': 'Editar',
    'ui.add': 'Añadir',
    'ui.close': 'Cerrar',
    'ui.confirm': 'Confirmar',
    'ui.loading': 'Cargando...',
    'ui.error': 'Error',
    'ui.success': 'Éxito',
    'ui.warning': 'Advertencia',
    'ui.info': 'Información',
    'ui.yes': 'Sí',
    'ui.no': 'No',
    
    // Messages
    'messages.welcome': '¡Bienvenido a Project Shadow Casino!',
    'messages.loginSuccess': '¡Inicio de sesión exitoso!',
    'messages.loginFailed': 'Error al iniciar sesión. Verifica tus credenciales.',
  },
  
  // French translations
  fr: {
    // Auth page
    'auth.welcome': 'Bienvenue sur Project Shadow',
    'auth.subtitle': 'L\'expérience de jeu ultime',
    'auth.login': 'Connexion',
    'auth.register': 'S\'inscrire',
    'auth.username': 'Nom d\'utilisateur',
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.phone': 'Téléphone',
    'auth.signin': 'Se connecter',
    'auth.signup': 'S\'inscrire',
    'auth.languageSelector': 'Sélectionner la langue',
    'auth.switchToLogin': 'Déjà un compte? Connectez-vous',
    'auth.switchToRegister': 'Pas de compte? Inscrivez-vous',
    
    // Navigation
    'nav.home': 'Accueil',
    'nav.games': 'Jeux',
    'nav.dice': 'Dés',
    'nav.plinko': 'Plinko',
    'nav.slots': 'Machines à sous',
    'nav.wallet': 'Portefeuille',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    'nav.referrals': 'Parrainages',
    'nav.chat': 'Chat',
    'nav.support': 'Support',
    'nav.logout': 'Déconnexion',
    'nav.leaderboard': 'Classement',
    'nav.themes': 'Thèmes',
    'nav.currency': 'Devise',
    'nav.transactions': 'Transactions',
    'nav.settings': 'Paramètres',
    
    // Games
    'games.title': 'Jeux',
    'games.backToGames': 'Retour aux jeux',
    'games.placeYourBet': 'Placez votre mise',
    'games.betAmount': 'Montant de la mise',
    'games.balance': 'Solde',
    'games.youWon': 'Vous avez gagné!',
    'games.youLost': 'Vous avez perdu',
    
    // UI
    'ui.save': 'Enregistrer',
    'ui.cancel': 'Annuler',
    'ui.delete': 'Supprimer',
    'ui.edit': 'Modifier',
    'ui.add': 'Ajouter',
    'ui.close': 'Fermer',
    'ui.confirm': 'Confirmer',
    'ui.loading': 'Chargement...',
    'ui.error': 'Erreur',
    'ui.success': 'Succès',
  },
  
  // German translations
  de: {
    // Auth page
    'auth.welcome': 'Willkommen bei Project Shadow',
    'auth.subtitle': 'Das ultimative Spielerlebnis',
    'auth.login': 'Anmelden',
    'auth.register': 'Registrieren',
    'auth.username': 'Benutzername',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.phone': 'Telefon',
    'auth.signin': 'Einloggen',
    'auth.signup': 'Registrieren',
    'auth.languageSelector': 'Sprache auswählen',
    'auth.switchToLogin': 'Bereits ein Konto? Anmelden',
    'auth.switchToRegister': 'Kein Konto? Registrieren',
    
    // Navigation
    'nav.home': 'Startseite',
    'nav.games': 'Spiele',
    'nav.dice': 'Würfel',
    'nav.plinko': 'Plinko',
    'nav.slots': 'Spielautomaten',
    'nav.wallet': 'Geldbörse',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    'nav.referrals': 'Empfehlungen',
    'nav.chat': 'Chat',
    'nav.support': 'Support',
    'nav.logout': 'Abmelden',
    
    // Games
    'games.title': 'Spiele',
    'games.backToGames': 'Zurück zu Spielen',
    'games.placeYourBet': 'Platzieren Sie Ihre Wette',
    'games.betAmount': 'Wetteinsatz',
    'games.balance': 'Guthaben',
    'games.youWon': 'Sie haben gewonnen!',
    'games.youLost': 'Sie haben verloren',
    
    // UI
    'ui.save': 'Speichern',
    'ui.cancel': 'Abbrechen',
    'ui.delete': 'Löschen',
    'ui.edit': 'Bearbeiten',
    'ui.add': 'Hinzufügen',
    'ui.close': 'Schließen',
    'ui.confirm': 'Bestätigen',
    'ui.loading': 'Laden...',
  },
  
  // Chinese translations
  zh: {
    // Auth page
    'auth.welcome': '欢迎来到 Project Shadow',
    'auth.subtitle': '终极游戏体验',
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.username': '用户名',
    'auth.email': '电子邮件',
    'auth.password': '密码',
    'auth.phone': '电话',
    'auth.signin': '登录',
    'auth.signup': '注册',
    'auth.languageSelector': '选择语言',
    'auth.switchToLogin': '已有账户？登录',
    'auth.switchToRegister': '没有账户？注册',
    
    // Navigation
    'nav.home': '首页',
    'nav.games': '游戏',
    'nav.dice': '骰子',
    'nav.plinko': 'Plinko',
    'nav.slots': '老虎机',
    'nav.wallet': '钱包',
    'nav.profile': '个人资料',
    'nav.admin': '管理',
    'nav.referrals': '推荐',
    'nav.chat': '聊天',
    'nav.support': '支持',
    'nav.logout': '退出',
    
    // Games
    'games.title': '游戏',
    'games.backToGames': '返回游戏',
    'games.placeYourBet': '下注',
    'games.betAmount': '投注金额',
    'games.balance': '余额',
    'games.youWon': '你赢了！',
    'games.youLost': '你输了',
    
    // UI
    'ui.save': '保存',
    'ui.cancel': '取消',
    'ui.delete': '删除',
    'ui.edit': '编辑',
    'ui.add': '添加',
    'ui.close': '关闭',
    'ui.confirm': '确认',
    'ui.loading': '加载中...',
  },
  
  // Japanese translations
  ja: {
    // Auth page
    'auth.welcome': 'Project Shadow へようこそ',
    'auth.subtitle': '究極のゲーム体験',
    'auth.login': 'ログイン',
    'auth.register': '登録',
    'auth.username': 'ユーザー名',
    'auth.email': 'メール',
    'auth.password': 'パスワード',
    'auth.phone': '電話',
    'auth.signin': 'サインイン',
    'auth.signup': 'サインアップ',
    'auth.languageSelector': '言語を選択',
    'auth.switchToLogin': 'アカウントをお持ちですか？ログイン',
    'auth.switchToRegister': 'アカウントがありませんか？登録',
    
    // Navigation
    'nav.home': 'ホーム',
    'nav.games': 'ゲーム',
    'nav.dice': 'サイコロ',
    'nav.plinko': 'プリンコ',
    'nav.slots': 'スロット',
    'nav.wallet': 'ウォレット',
    'nav.profile': 'プロフィール',
    'nav.admin': '管理',
    'nav.referrals': '紹介',
    'nav.chat': 'チャット',
    'nav.support': 'サポート',
    'nav.logout': 'ログアウト',
    
    // Games
    'games.title': 'ゲーム',
    'games.backToGames': 'ゲームに戻る',
    'games.placeYourBet': 'ベットする',
    'games.betAmount': 'ベット額',
    'games.balance': '残高',
    'games.youWon': '勝ちました！',
    'games.youLost': '負けました',
    
    // UI
    'ui.save': '保存',
    'ui.cancel': 'キャンセル',
    'ui.delete': '削除',
    'ui.edit': '編集',
    'ui.add': '追加',
    'ui.close': '閉じる',
    'ui.confirm': '確認',
    'ui.loading': '読み込み中...',
  },
  
  // For other languages, we'll use the fallback system to English
  ko: {},
  ar: {},
  hi: {},
  ru: {},
  pt: {},
  it: {},
  tr: {},
  nl: {},
  th: {},
  vi: {},
  id: {},
  ms: {},
  pl: {}
};

// Get translation function
export function getTranslation(key: string, language: string = DEFAULT_LANGUAGE): string {
  const translations = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
  return translations[key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
}

// Hook for using translations in components
export function useTranslation(language: string = DEFAULT_LANGUAGE) {
  return (key: string) => getTranslation(key, language);
}

// Short alias for translation function
export const t = getTranslation;

// Get language object by code
export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

// RTL languages
export const RTL_LANGUAGES = ['ar'];
export function isRTLLanguage(language: string): boolean {
  return RTL_LANGUAGES.includes(language);
}

// Storage utilities for language preferences
export function getStoredLanguage(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || DEFAULT_LANGUAGE;
  }
  return DEFAULT_LANGUAGE;
}

export function setStoredLanguage(language: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
  }
}