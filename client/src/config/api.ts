// Production-ready API configuration
export const API_CONFIG = {
  // Backend URLs
  REPLIT_BACKEND: 'https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev',
  LOCAL_BACKEND: 'http://localhost:5000',
  
  // Smart environment detection
  getBaseURL(): string {
    // Support environment variable override for build systems
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
      console.log('🔧 Using environment variable API URL');
      return import.meta.env.VITE_API_BASE_URL;
    }
    
    // Support window global override for deployed sites
    if (typeof window !== 'undefined' && (window as any).REPLIT_BACKEND_URL) {
      console.log('🌐 Using window global API URL');
      return (window as any).REPLIT_BACKEND_URL;
    }
    
    // Server-side rendering fallback
    if (typeof window === 'undefined') {
      return this.REPLIT_BACKEND;
    }
    
    const hostname = window.location.hostname;
    console.log(`🔍 Hostname detected: ${hostname}`);
    
    // Deployed domain configuration
    if (hostname === 'projectshadow.infy.uk') {
      console.log('🌍 Deployed domain detected → Replit backend');
      return this.REPLIT_BACKEND;
    }
    
    // Replit preview environment
    if (hostname.includes('.replit.dev') || hostname.includes('.pike.replit.dev')) {
      console.log('🔧 Replit preview detected → Relative URLs');
      return '';
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('💻 Local development detected → Local backend');
      return this.LOCAL_BACKEND;
    }
    
    // Default to Replit backend for unknown domains
    console.log(`❓ Unknown hostname: ${hostname} → Defaulting to Replit backend`);
    return this.REPLIT_BACKEND;
  }
};

// Export direct API base URL for easier usage
export const API_BASE_URL = API_CONFIG.getBaseURL();

// Helper function to build full API URLs
export function buildAPIUrl(endpoint: string): string {
  const baseURL = API_CONFIG.getBaseURL();
  
  // Ensure endpoint starts with /
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  const fullUrl = baseURL + endpoint;
  
  // Debug logging for deployment troubleshooting
  if (typeof window !== 'undefined' && window.location.hostname === 'projectshadow.infy.uk') {
    console.log(`🔗 API URL built: ${endpoint} → ${fullUrl}`);
  }
  
  return fullUrl;
}

// Helper function to build WebSocket URLs
export function buildWebSocketUrl(): string {
  if (typeof window === 'undefined') {
    return API_CONFIG.REPLIT_BACKEND.replace('https://', 'wss://') + '/ws';
  }
  
  const hostname = window.location.hostname;
  
  if (hostname === 'projectshadow.infy.uk') {
    const wsUrl = API_CONFIG.REPLIT_BACKEND.replace('https://', 'wss://') + '/ws';
    console.log(`🔌 WebSocket URL for deployed domain: ${wsUrl}`);
    return wsUrl;
  }
  
  if (hostname.includes('.replit.dev')) {
    return `wss://${window.location.host}/ws`;
  }
  
  // For local development
  return 'ws://localhost:5000/ws';
}