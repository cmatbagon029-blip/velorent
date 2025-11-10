# Social Login Setup Guide

This guide will help you set up Google and Facebook OAuth authentication for the VELORENT application.

## Prerequisites

1. Google Cloud Console account
2. Facebook Developer account
3. Backend server running on localhost:3000

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8100/auth/google/callback`
   - `http://localhost:3000/auth/google/callback`
7. Copy the Client ID

### 2. Update Configuration

In `velorent-app/src/app/services/social-auth.service.ts`, replace:
```typescript
const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your actual Google Client ID
```

## Facebook OAuth Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Go to Facebook Login → Settings
5. Add Valid OAuth Redirect URIs:
   - `http://localhost:8100/auth/facebook/callback`
   - `http://localhost:3000/auth/facebook/callback`
6. Copy the App ID

### 2. Update Configuration

In `velorent-app/src/app/services/social-auth.service.ts`, replace:
```typescript
const appId = 'YOUR_FACEBOOK_APP_ID'; // Replace with your actual Facebook App ID
```

## Backend Setup

### 1. Update Database Schema

Add social login fields to your users table:

```sql
ALTER TABLE users 
ADD COLUMN social_id VARCHAR(255) NULL,
ADD COLUMN provider ENUM('google', 'facebook') NULL,
ADD COLUMN picture VARCHAR(500) NULL;
```

### 2. Update JWT Secret

In `backend/routes/auth.js`, replace:
```javascript
const token = jwt.sign(
  { 
    userId: user.id, 
    email: user.email,
    provider: user.provider 
  },
  'your-secret-key', // Replace with your actual secret key
  { expiresIn: '24h' }
);
```

## Testing

1. Start your backend server: `cd backend && node app.js`
2. Start your frontend: `cd velorent-app && npm start`
3. Navigate to `http://localhost:8100/login`
4. Click on Google or Facebook login buttons
5. Complete OAuth flow in popup window
6. User should be redirected to dashboard upon successful authentication

## Security Notes

1. **HTTPS Required**: OAuth providers require HTTPS in production
2. **Environment Variables**: Store OAuth credentials in environment variables
3. **Token Validation**: Implement proper JWT token validation
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **CORS Configuration**: Configure CORS properly for production

## Production Deployment

1. Update redirect URIs to use your production domain
2. Set up HTTPS certificates
3. Configure environment variables
4. Update CORS settings
5. Implement proper error handling and logging

## Troubleshooting

### Common Issues:

1. **Popup Blocked**: Ensure popup blockers are disabled
2. **CORS Errors**: Check CORS configuration in backend
3. **Invalid Redirect URI**: Verify redirect URIs match exactly
4. **Token Errors**: Check JWT secret and expiration settings

### Debug Steps:

1. Check browser console for errors
2. Verify OAuth credentials are correct
3. Test backend endpoints with Postman
4. Check database connection and schema
5. Verify redirect URIs in OAuth provider settings

