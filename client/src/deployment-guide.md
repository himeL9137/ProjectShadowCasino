# Frontend Deployment Guide for projectshadow.infy.uk

## Quick Fix for Your Deployed Frontend

### Option 1: Environment Variable (Recommended)
When building your frontend for deployment, set this environment variable:

```bash
VITE_API_BASE_URL=https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev
```

### Option 2: Simple JavaScript Configuration
Add this to your index.html before any script tags:

```html
<script>
  window.REPLIT_BACKEND_URL = 'https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev';
</script>
```

### Option 3: Direct API Base URL Override
Replace the contents of `client/src/config/api.ts` with:

```typescript
// Simple production configuration for deployed frontend
export const API_CONFIG = {
  REPLIT_BACKEND: 'https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev',
  
  getBaseURL(): string {
    // For deployed frontend at projectshadow.infy.uk, always use Replit backend
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Use full backend URL for deployed domain
      if (hostname === 'projectshadow.infy.uk') {
        return this.REPLIT_BACKEND;
      }
      
      // Use relative URLs for Replit preview
      if (hostname.includes('.replit.dev')) {
        return '';
      }
    }
    
    // Default to Replit backend for unknown environments
    return this.REPLIT_BACKEND;
  }
};

export const API_BASE_URL = API_CONFIG.getBaseURL();

export function buildAPIUrl(endpoint: string): string {
  const baseURL = API_CONFIG.getBaseURL();
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  return baseURL + endpoint;
}

export function buildWebSocketUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'projectshadow.infy.uk') {
    return 'wss://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev/ws';
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('.replit.dev')) {
    return `wss://${window.location.host}/ws`;
  }
  return 'wss://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev/ws';
}
```

## Backend Status ✅
Your Replit backend is properly configured and running at:
`https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev`

## Test Your Setup
1. Visit your deployed frontend at `https://projectshadow.infy.uk`
2. Check browser console for "🌍 Detected deployed domain" message
3. Verify API calls go to the full Replit URL
4. Test login with existing admin account

The backend CORS is already configured to accept requests from your deployed domain.