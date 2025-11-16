# Deployment Checklist

## Pre-Deployment

### Code Quality ✅
- [x] No linter errors
- [x] All dependencies installed
- [x] Frontend builds successfully
- [x] Backend starts without errors
- [x] All imports resolve correctly

### Configuration ✅
- [x] CORS configurable via `FRONTEND_URL` env var
- [x] API URL configurable via `VITE_API_BASE_URL`
- [x] Environment variables documented
- [x] `.env.example` files created

### Security ✅
- [x] All secrets in environment variables
- [x] `.gitignore` excludes `.env` files
- [x] Database files excluded from git
- [x] No hardcoded API keys

### Documentation ✅
- [x] README.md updated
- [x] DEPLOYMENT.md created
- [x] AI_PROVIDERS.md created
- [x] Dockerfile created
- [x] docker-compose.yml created

## Deployment Steps

### 1. Environment Setup
```bash
# Backend
cd backend
cp ../.env.example .env
# Edit .env with your API keys

# Frontend  
cd frontend
cp ../frontend/.env.example .env
# Edit .env with your backend URL
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Build
```bash
# Frontend
cd frontend
npm run build
# Output: frontend/dist/
```

### 4. Test Locally
```bash
# Backend
cd backend
npm start
# Should start on port 3001

# Frontend (dev mode)
cd frontend
npm run dev
# Should start on port 5173
```

### 5. Deploy

**Option A: Vercel (Frontend) + Railway (Backend)**
- Frontend: Connect repo, set root to `frontend`, build command `npm run build`
- Backend: Connect repo, set root to `backend`, start command `npm start`

**Option B: Docker**
```bash
docker-compose up -d
```

**Option C: Manual**
- Serve `frontend/dist/` with nginx/apache
- Run backend with PM2 or systemd

## Post-Deployment

- [ ] Verify health endpoint: `GET /api/health`
- [ ] Test wallet connection
- [ ] Test AI assistant (with API keys)
- [ ] Verify CORS works
- [ ] Check error logs
- [ ] Monitor API usage

## Troubleshooting

**Backend won't start:**
- Check PORT is available
- Verify database permissions
- Check environment variables

**Frontend can't connect:**
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings in backend
- Verify backend is running

**AI not working:**
- Verify API keys in `backend/.env`
- Check API key permissions
- Review error logs

