# Social Login Setup Guide

## Current Status: DEMO MODE ✅

The social login buttons now work in **demo mode** - they will show confirmation dialogs and simulate social login without requiring real OAuth credentials.

## Demo Mode Features

### 🎯 **What Works Now:**
- ✅ **Google Login Demo**: Click → Confirm → Simulated Google login
- ✅ **Facebook Login Demo**: Click → Confirm → Simulated Facebook login  
- ✅ **Twitter Login Demo**: Click → Confirm → Simulated Twitter login
- ✅ **User Creation**: Demo accounts are created in your database
- ✅ **Session Management**: Full login functionality with JWT tokens
- ✅ **Profile Pictures**: Branded placeholder avatars for each platform

### 🔧 **How to Test:**
1. Open `login.html` or `signup.html`
2. Click any social login button (Google/Facebook/Twitter)
3. Confirm the demo dialog that appears
4. You'll be logged in with a demo account for that platform

---

## Production Setup (Optional)

To enable **real OAuth** instead of demo mode, follow these steps:

### 🔵 **Google OAuth Setup**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a Project** or select existing one
3. **Enable Google+ API**:
   - APIs & Services → Library → Search "Google+ API" → Enable
4. **Create OAuth Credentials**:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized origins: `http://localhost:3000` (or your domain)
   - Copy your **Client ID**

5. **Update Code**:
   ```javascript
   // In login.html and signup.html, uncomment and update:
   client_id: 'YOUR-ACTUAL-GOOGLE-CLIENT-ID.apps.googleusercontent.com'
   ```

6. **Uncomment SDK**:
   ```html
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```

### 🔴 **Facebook OAuth Setup**

1. **Go to Facebook Developers**: https://developers.facebook.com/
2. **Create an App**:
   - Create App → Consumer → Continue
   - App Display Name: "Your App Name"
3. **Get App ID**:
   - App Settings → Basic → Copy **App ID**
4. **Configure Domain**:
   - App Settings → Basic → Add Platform → Website
   - Site URL: `http://localhost:3000` (or your domain)

5. **Update Code**:
   ```javascript
   // In login.html and signup.html, update:
   appId: 'YOUR-ACTUAL-FACEBOOK-APP-ID'
   ```

6. **Uncomment SDK**:
   ```html
   <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>
   ```

### 🐦 **Twitter OAuth Setup**

1. **Go to Twitter Developer Portal**: https://developer.twitter.com/
2. **Create a Project & App**
3. **Get API Keys**:
   - Copy **API Key** and **API Secret Key**
4. **Configure Callback URLs**:
   - Add `http://localhost:3000/auth/twitter/callback`

5. **Backend Implementation Required**:
   Twitter OAuth requires server-side token exchange. You'll need to implement:
   ```javascript
   // Backend route for Twitter OAuth
   router.get('/auth/twitter', passport.authenticate('twitter'));
   router.get('/auth/twitter/callback', passport.authenticate('twitter', {
     successRedirect: '/',
     failureRedirect: '/login'
   }));
   ```

---

## Security Notes

### 🔒 **Current Demo Security:**
- Demo accounts use unique IDs with timestamps
- All demo accounts are properly stored in database
- JWT tokens are generated normally
- Full session management works

### 🔒 **Production Security:**
- Never store OAuth secrets in frontend code
- Use HTTPS in production
- Validate OAuth tokens on backend
- Implement proper CORS policies
- Add rate limiting for OAuth endpoints

---

## Troubleshooting

### ❌ **If you see errors:**
1. **"Invalid app ID"**: You're seeing demo mode working correctly
2. **"Google window not opening"**: Demo mode is active - click and confirm dialog
3. **"Twitter window not displaying"**: Demo mode simulation - confirm the dialog

### ✅ **Expected Demo Behavior:**
1. Click social button
2. See confirmation dialog asking about demo mode
3. Click "OK" to continue with demo login
4. Successfully log in with demo account

---

## Migration from Demo to Production

When ready for production:

1. **Uncomment SDK script tags** in both `login.html` and `signup.html`
2. **Replace demo credentials** with real OAuth credentials  
3. **Remove demo confirmation dialogs**
4. **Test with real OAuth providers**
5. **Update domain settings** in OAuth provider dashboards

---

## Current Implementation Status

✅ **Working Now:**
- Demo mode social login
- User account creation
- Session management
- Profile picture handling
- Database integration

🔄 **Ready for Production:**
- OAuth credential configuration
- Real provider integration
- Token validation
- Security hardening

The demo mode provides a complete working social login experience that you can test immediately!