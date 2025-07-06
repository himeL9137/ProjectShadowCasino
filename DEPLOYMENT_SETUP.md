# Shadow Casino - Deployment Configuration Guide

## Current Setup

Your Shadow Casino application is now properly configured to work with your deployed frontend at `https://projectshadow.infy.uk` and your Replit backend.

### Backend Configuration ✅

**Replit Backend URL:** `https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev`

**CORS Configuration:**
- ✅ Updated CORS to specifically allow your deployed domain
- ✅ Supports credentials (cookies, authorization headers)
- ✅ Allows all necessary HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- ✅ Includes proper headers for authentication

### Frontend Configuration ✅

**API Configuration:**
- ✅ Created environment-aware API configuration (`client/src/config/api.ts`)
- ✅ Automatically detects deployment environment and uses correct backend URL
- ✅ Updated API client to build full URLs for deployed frontend
- ✅ Enhanced WebSocket connection to work across environments

**Environment Detection:**
- When on `projectshadow.infy.uk` → Uses Replit backend URL
- When on Replit preview → Uses relative URLs  
- When on localhost → Uses local backend

### Key Files Updated

1. **`server/index.ts`** - Enhanced CORS configuration for deployed domain
2. **`client/src/config/api.ts`** - New environment-aware API configuration
3. **`client/src/lib/api.ts`** - Updated to use full URLs for deployed frontend
4. **`client/src/providers/WebSocketProvider.tsx`** - Enhanced WebSocket URL configuration

## For Your Deployed Frontend

### Required Environment Variables

When building your frontend for `https://projectshadow.infy.uk`, ensure these are set:

```env
VITE_API_BASE_URL=https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev
```

### Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The built files will be in the 'dist' directory
```

### Verification Checklist

When you deploy your frontend to `https://projectshadow.infy.uk`:

1. **Login System:** Test user authentication with existing accounts
2. **API Requests:** Check browser console for successful API calls
3. **WebSocket:** Verify real-time features work (chat, balance updates)
4. **CORS:** Ensure no CORS errors in browser console
5. **Games:** Test casino games for proper balance updates

### Troubleshooting

**If you see "Failed to fetch" errors:**
1. Check browser console for specific error details
2. Verify your deployed frontend is using HTTPS (not HTTP)
3. Ensure the Replit backend is running and accessible
4. Check for any CORS errors in browser console

**Common Issues:**
- **Mixed Content:** Ensure both frontend (HTTPS) and backend (HTTPS) use same protocol
- **Token Issues:** Check that authentication cookies are being sent with requests
- **WebSocket Failures:** Verify WSS (secure WebSocket) connections work

### Testing

You can test the backend is working by visiting:
- API health: `https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev/api/health`
- User endpoint: `https://ddae7a2f-bbd5-46fe-93fa-dc73fce10ee0-00-3owymylj2hnbq.pike.replit.dev/api/user`

## Next Steps

1. **Deploy your frontend** with the updated configuration
2. **Test all functionality** on your live domain
3. **Monitor browser console** for any remaining issues
4. **Verify admin features** work correctly

The backend is now fully configured and running with proper CORS settings for your deployed domain.