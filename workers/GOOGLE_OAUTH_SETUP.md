# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for the Workers Portal.

## Prerequisites

1. A Google Cloud Console account
2. Cloudflare Workers CLI (`wrangler`) installed
3. Access to Cloudflare D1 database

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: External (or Internal for Workspace)
   - App name: DigiArtifact Workers Portal
   - User support email: your email
   - Authorized domains: `digiartifact.com`, `workers.digiartifact.com`
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: Workers Portal
   - Authorized JavaScript origins:
     - `https://workers.digiartifact.com`
     - `http://localhost:3000` (for development)
   - Authorized redirect URIs:
     - `https://digiartifact-workers-api.digitalartifact11.workers.dev/api/auth/google/callback`
     - `http://localhost:8787/api/auth/google/callback` (for development)
7. Save and copy your **Client ID** and **Client Secret**

## Step 2: Configure Cloudflare Worker Secrets

Set the secrets using Wrangler CLI:

```bash
cd workers/api

# Set Google OAuth credentials as secrets (not visible in config)
wrangler secret put GOOGLE_CLIENT_ID
# Paste your Client ID when prompted

wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Client Secret when prompted
```

## Step 3: Configure Next.js Environment

Create a `.env.local` file in the `workers/` directory:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

For production (Cloudflare Pages), add this as an environment variable in the Pages dashboard.

## Step 4: Run Database Migration

Apply the OAuth schema changes:

```bash
cd workers/api

# Run the migration
wrangler d1 execute digiartifact-workers --file=./schema-v4-oauth.sql
```

This adds `google_id` and `google_picture` columns to the users table.

## Step 5: Deploy

```bash
# Deploy the API
cd workers/api
wrangler deploy

# Deploy the frontend
cd ..
npm run build
# Push to GitHub for Cloudflare Pages auto-deploy
```

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google" button
2. Google Identity Services (GIS) library handles the OAuth popup
3. User authenticates with Google
4. Google returns an ID token (credential)
5. Frontend sends the credential to our API (`/api/auth/google/verify`)
6. API verifies the token with Google
7. API creates/finds user in database
8. API returns our JWT token
9. Frontend stores JWT and redirects to dashboard

### User Management

- **Existing users**: If a user exists with the same email, their account is linked to Google
- **New users**: If `ALLOW_SIGNUPS=true`, new users are created automatically
- **Access control**: Set `ALLOW_SIGNUPS=false` in production to restrict access to pre-created users only

### Security Considerations

- Client ID is public and safe to include in frontend code
- Client Secret is stored as a Cloudflare secret (never in code)
- JWT tokens expire after 7 days
- All API requests require valid JWT authentication

## Troubleshooting

### "Google Sign-In not configured" warning
- Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in your environment

### "Not authorized" error
- Check `ALLOW_SIGNUPS` setting
- Verify user exists in database with matching email

### "Token verification failed"
- Ensure `GOOGLE_CLIENT_ID` secret is set correctly in Cloudflare
- Check that the token's audience matches your Client ID

### OAuth callback errors
- Verify redirect URIs in Google Cloud Console match exactly
- Check CORS settings in wrangler.toml
