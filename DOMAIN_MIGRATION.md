# Domain Migration Guide

## Overview
This guide covers the steps needed when migrating from Cloudflare Pages (.pages.dev) to a custom .co.za domain.

## ✅ Completed Updates

### 1. CORS Headers Added
- Updated `functions/api/auth/login.js` and `functions/api/auth/register.js` to include CORS headers
- Updated `functions/api/verify-payment.js` to include CORS headers
- All CORS headers configured for `https://notevault.co.za` and `https://www.notevault.co.za`
- These headers allow requests from your custom domain

### 2. Internal Links Verified
- All internal links already use relative paths (e.g., `/login.html`, `/api/auth/check`)
- No hardcoded .pages.dev URLs found
- No changes needed

### 3. Paystack Configuration
- Paystack payment flow uses both JavaScript callback function (client-side) and callback_url (server-side)
- Added `callback_url: 'https://notevault.co.za/api/verify-payment'` to `PaystackPop.setup()` in `view.html`
- The callback URL is configured for server-side webhooks from Paystack

## 🔧 Required Actions

### Step 1: Update Paystack Dashboard
1. Log in to your Paystack Dashboard
2. Go to Settings → API Keys & Webhooks
3. Update the "Callback URL" field to: `https://notevault.co.za/api/verify-payment`
4. If you have webhooks configured, update those URLs as well

**Note**: The payment verification happens both client-side (via JavaScript callback) and server-side (via callback_url webhook from Paystack).

### Step 2: Cloudflare Pages Custom Domain Setup
1. In Cloudflare Dashboard → Pages → Your Project
2. Go to Custom Domains
3. Add your custom domain (e.g., `notevaultsa.co.za`)
4. Configure DNS records as instructed by Cloudflare
5. Enable SSL/TLS (automatic with Cloudflare)

### Step 3: Test After Migration
- [ ] Test login functionality
- [ ] Test registration functionality
- [ ] Test payment flow with Paystack
- [ ] Verify all internal links work correctly
- [ ] Check that cookies are set correctly (SameSite=Strict may need adjustment if using subdomains)

## 📝 Additional Notes

### CORS Configuration
The CORS headers are configured to:
- Allow requests from your custom domain
- Support credentials (cookies)
- Handle preflight OPTIONS requests
- Allow common HTTP methods (GET, POST, PUT, DELETE)

### Cookie Security
Current cookie settings:
- `SameSite=Strict` - Prevents cross-site requests
- `HttpOnly` - Prevents JavaScript access
- `Secure` - Should be enabled in production (requires HTTPS)

If you need to support subdomains, you may need to adjust the cookie `Domain` attribute.

### Other API Functions
If you have other API functions that need CORS support, add the same CORS header logic. The pattern is:

```javascript
// At the start of the function
const origin = request.headers.get('Origin') || '';
const allowedOrigins = [
    'https://notevault.co.za',
    'https://www.notevault.co.za',
];
const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed)) || !origin;
const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Add to all Response headers
headers: { 
    'Content-Type': 'application/json',
    ...corsHeaders
}
```

## 🚨 Important Reminders

1. **Replace domain placeholders** before deploying to production
2. **Update Paystack callback URLs** in the dashboard
3. **Test thoroughly** after domain migration
4. **Monitor error logs** for any CORS or domain-related issues
5. **Update any external integrations** that reference your old .pages.dev URL

