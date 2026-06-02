# Atlas - Setup Guide

## Prerequisites
- Node.js 20+
- npm
- Supabase CLI (`brew install supabase/tap/supabase`)

## Local Development

```bash
npm install
npm run dev
```

## Supabase Configuration

### 1. Create a Supabase Project
- Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
- Copy the **Project URL** and **anon key** from Settings > API

### 2. Link Local Project
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 3. Set Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
```

### 4. Google OAuth Setup

**In Google Cloud Console:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project
3. Go to APIs & Services > Credentials
4. Create an OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret

**In Supabase Dashboard:**
1. Go to Authentication > Providers > Google
2. Enable Google provider
3. Paste Client ID and Client Secret
4. Save

### 5. Push Notifications (VAPID Keys)

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

- Set the public key as `VITE_VAPID_PUBLIC_KEY` in `.env.local`
- Store the private key as a secret in your Supabase Edge Function (for sending notifications later)

## iOS Installation
- Open the app in Safari on iOS 16.4+
- Tap the Share button > "Add to Home Screen"
- Push notifications only work when the app is installed to the home screen

## Scripts
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
