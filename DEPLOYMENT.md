# Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

**Backend:**
```bash
cd backend
npm install
cp ../.env.example .env  # Edit with your API keys
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Environment Variables

**Backend (`backend/.env`):**
```env
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# AI Providers (at least one recommended)
GEMINI_API_KEY=your_key
CHATGPT_API_KEY=your_key
CLAUDE_API_KEY=your_key
GROQ_API_KEY=your_key
MISTRAL_API_KEY=your_key
TOGETHER_API_KEY=your_key

# Optional
HELIUS_API_KEY=your_key
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### Build Commands

**Backend:**
```bash
cd backend
npm install --production
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
# Serve frontend/dist/ with nginx, Vercel, etc.
```

## Deployment Platforms

### Vercel (Frontend)
1. Connect GitHub repo
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment: `VITE_API_BASE_URL`

### Railway / Render (Backend)
1. Root directory: `backend`
2. Start command: `npm start`
3. Add all environment variables

### Docker (Optional)
See `Dockerfile` in repo root.

## Health Check
- Backend: `GET /api/health`
- Returns: `{ success: true, message: "Phanta Backend is running" }`

## Security Notes
- ✅ CORS configured via `FRONTEND_URL` env var
- ✅ All secrets in environment variables
- ✅ SQLite database auto-created
- ⚠️ Update CORS for production domain
- ⚠️ Use HTTPS in production
