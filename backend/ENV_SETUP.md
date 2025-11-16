# Environment Variables Setup Guide

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your API keys:**
   - At minimum, add `GEMINI_API_KEY` for AI features
   - Optionally add `HELIUS_API_KEY` for enhanced Solana data

3. **For frontend (optional):**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit if you need to change the API URL
   ```

## Required API Keys

### GEMINI_API_KEY (Required for AI features)
- **Get it from:** https://aistudio.google.com/app/apikey
- **Free tier:** Yes, generous free tier
- **Required for:** AI Assistant, Group Chat AI features
- **What happens without it:** AI features will show fallback messages

## Optional API Keys

### HELIUS_API_KEY (Recommended)
- **Get it from:** https://helius.dev
- **Free tier:** Yes, free tier available
- **Required for:** Enhanced transaction parsing, better Solana data
- **What happens without it:** App uses public Solana RPC (rate-limited, less detailed)

### Alternative AI Providers (Optional)
You can add these instead of or in addition to Gemini:
- `CHATGPT_API_KEY` - https://platform.openai.com/api-keys
- `CLAUDE_API_KEY` - https://console.anthropic.com/settings/keys
- `GROQ_API_KEY` - https://console.groq.com/keys
- `MISTRAL_API_KEY` - https://console.mistral.ai/api-keys/
- `TOGETHER_API_KEY` - https://api.together.xyz/settings/api-keys

## APIs That Don't Require Keys

These APIs are used automatically without keys:
- **CoinGecko API** - Market data (free, rate-limited)
- **Jupiter API** - Token prices (free, no key needed)
- **Solana RPC** - Public endpoints (free, rate-limited)

## Testing Your Setup

After setting up your `.env` file:

1. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Check the health endpoint:**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Check API key status:**
   ```bash
   curl http://localhost:3001/api/health/api-keys
   ```

## Production Deployment

For production, set these environment variables in your hosting platform:
- Railway, Render, Heroku: Add in dashboard
- Docker: Use `docker-compose.yml` or pass via `-e` flags
- Vercel: Add in project settings

**Important:** Never commit your `.env` file to git! It's already in `.gitignore`.
