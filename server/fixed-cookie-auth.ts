
// Helper functions for auth.ts

export function validateJWTCookie(req: any) {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      console.log('No JWT cookie found');
      return null;
    }

    // Check for any admin user
    if (token && req.user?.role === 'admin' && 
        (req.user?.username === 'admin' || 
         req.user?.username === 'shadowHimel' || 
         req.user?.username === 'Albab AJ' ||
         req.user?.username === 'Aj Albab')) {
      return req.user;
    }

    return null;
  } catch (err) {
    console.error('JWT validation error:', err);
    return null;
  }
}

export function setJWTCookie(res: any, token: string) {
  res.cookie('jwt', token, {
    httpOnly: false,
    secure: false,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax',
    path: '/'
  });
}
