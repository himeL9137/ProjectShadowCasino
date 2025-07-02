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
  
  // Other languages with English fallback for now
  es: {},
  fr: {},
  de: {},
  zh: {},
  ja: {},
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