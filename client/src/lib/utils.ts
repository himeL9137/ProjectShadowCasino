import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency values with proper symbols
export function formatCurrency(amount: number | string, currency: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  switch (currency) {
    case 'USD':
      return `$${numAmount.toFixed(2)}`;
    case 'BDT':
      return `৳${numAmount.toFixed(2)}`;
    case 'INR':
      return `₹${numAmount.toFixed(2)}`;
    case 'BTC':
      // For BTC, show more decimal places
      return `₿${numAmount.toFixed(8)}`;
    default:
      return `${numAmount.toFixed(2)}`;
  }
}

// Format date/time for display
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format time ago (e.g., "2 minutes ago")
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return `${interval} year${interval === 1 ? '' : 's'} ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return `${interval} month${interval === 1 ? '' : 's'} ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return `${interval} day${interval === 1 ? '' : 's'} ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return `${interval} hour${interval === 1 ? '' : 's'} ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return `${interval} minute${interval === 1 ? '' : 's'} ago`;
  }
  
  return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
}

// Generate a random username initials for avatar
export function getInitials(username: string): string {
  if (!username) return "U";
  
  const parts = username.split(/[\s_-]/);
  if (parts.length > 1) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  
  return username.substring(0, 2).toUpperCase();
}

// Generate avatar color based on username
export function getUserAvatarColor(username: string): string {
  const colors = [
    'bg-red-600',
    'bg-blue-600',
    'bg-green-600',
    'bg-yellow-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-indigo-600',
    'bg-teal-600',
  ];
  
  // Simple hash function to pick a color based on the username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Format game type for display
export function formatGameType(gameType: string): string {
  switch (gameType) {
    case 'slots':
      return 'Slots';
    case 'dice':
      return 'Dice';
    case 'plinko':
      return 'Plinko';
    default:
      return gameType.charAt(0).toUpperCase() + gameType.slice(1);
  }
}

// Get WhatsApp link
export function getWhatsAppLink(phone: string, message: string = ''): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
