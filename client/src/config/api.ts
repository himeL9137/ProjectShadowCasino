// API configuration for different environments
export const API_CONFIG = {
  // Base URLs for different environments
  REPLIT_BACKEND: 'https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev',
  LOCAL_BACKEND: 'http://localhost:5000',
  
  // Determine the appropriate base URL based on current environment
  getBaseURL(): string {
    // If we're on the deployed domain, use the Replit backend
    if (typeof window !== 'undefined' && window.location.hostname === 'projectshadow.infy.uk') {
      return this.REPLIT_BACKEND;
    }
    
    // If we're on Replit preview domain, use relative URLs
    if (typeof window !== 'undefined' && window.location.hostname.includes('.replit.dev')) {
      return '';
    }
    
    // For local development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return this.LOCAL_BACKEND;
    }
    
    // Default fallback
    return '';
  }
};

// Helper function to build full API URLs
export function buildAPIUrl(endpoint: string): string {
  const baseURL = API_CONFIG.getBaseURL();
  
  // Ensure endpoint starts with /
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  return baseURL + endpoint;
}

// Helper function to build WebSocket URLs
export function buildWebSocketUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'projectshadow.infy.uk') {
    return API_CONFIG.REPLIT_BACKEND.replace('https://', 'wss://') + '/ws';
  }
  
  if (typeof window !== 'undefined' && window.location.hostname.includes('.replit.dev')) {
    return `wss://${window.location.host}/ws`;
  }
  
  // For local development
  return 'ws://localhost:5000/ws';
}