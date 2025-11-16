# Phanta – AI-Powered Crypto Banking Assistant

Phanta is an AI-first crypto banking experience that turns your Phantom wallet into an intelligent portfolio management system. Built with real Solana on-chain data, live token prices, and Gemini AI insights. Get real-time portfolio tracking, risk analysis, and actionable trading recommendations powered by your actual wallet data.

---

## Overview
- **Audience** – Crypto-native investors and advisors who want a banking console that understands wallets instead of checking accounts.
- **Value** – Unified balances, interactive analytics, and an embedded AI analyst that stays useful even when Gemini is offline.
- **Stack** – React 19 + Vite frontend, Express + SQLite backend, Gemini 2.5 Flash for natural-language insights.

---

## Feature Tour
- **Real On-Chain Data** – Live Solana portfolio tracking via Helius API, real token balances and prices via Jupiter API
- **AI-Powered Assistant** – Gemini AI analyzes your real portfolio, provides risk analysis, and suggests optimizations
- **24h PnL Tracking** – Real-time profit/loss calculations with percentage changes
- **Risk Analysis** – Automatic risk scoring (0-100) with concentration warnings and recommendations
- **Portfolio Holdings** – See all your tokens with live USD values and allocation percentages
- **Trading Recommendations** – AI suggests rebalancing, diversification, and risk management strategies
- **Transaction History** – Real on-chain transaction log from your wallet
- **Modern UI** – Gemini/ChatGPT-style minimalistic interface, AI-first design

---

## Architecture at a Glance
```
phanta/
├── backend/                      # Express API and services
│   ├── config/loadEnv.js         # Layered dotenv loader for backend/.env and project-wide .env
│   ├── database.js               # SQLite helpers + schema bootstrap
│   ├── routes/
│   │   ├── auth.js               # Wallet onboarding + profile lookups
│   │   ├── finance.js            # Portfolio, transactions, Gemini chat proxy
│   │   └── orders.js             # Strategy scheduling endpoints (placeholder)
│   └── services/
│       ├── financeService.js     # Portfolio mocks, AI orchestration, fallback logic
│       ├── geminiClient.js       # Gemini REST client (2.5 Flash default)
│       └── stockAnalyticsService.js
├── frontend/
│   ├── src/Dashboard.jsx         # Main signed-in experience
│   ├── src/components/           # Layout, analytics, Gemini panels, etc.
│   └── src/services/api.js       # REST client targeting the backend
└── README.md
```

### Backend Highlights
- Express API with modular routes (auth, finance, orders).
- **Real Solana Integration** – Helius API for wallet indexing, Jupiter API for prices
- **Portfolio Service** – Real-time portfolio tracking with PnL calculations
- **Risk Analysis Engine** – Automatic risk scoring and warnings
- SQLite storage via `database.js` with helpers for queries and seeding.
- `financeService` integrates real portfolio data with Gemini AI insights
- `geminiClient` wraps the Generative Language API with transport fallbacks

### Frontend Highlights
- React 19 + Vite + Tailwind-inspired utility classes for fast iteration.
- Dashboard experience clusters portfolio metrics, charts, market intel, and the AI copilot.
- Componentized layout enables swapping data sources without reworking the entire shell.

---

## Environment Configuration
Phanta reads environment variables through `backend/config/loadEnv.js`, which layers `backend/.env` over a project-wide `.env` when present. 

**See `.env.example` for all available environment variables.**

**Backend (`backend/.env`):**
```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# AI Providers (at least one recommended)
GEMINI_API_KEY=your_key
CHATGPT_API_KEY=your_key
CLAUDE_API_KEY=your_key
GROQ_API_KEY=your_key
MISTRAL_API_KEY=your_key
TOGETHER_API_KEY=your_key

# Optional: Enhanced Solana data
HELIUS_API_KEY=your_key
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

> Tip: If you omit all AI API keys, the service automatically falls back to curated suggestions so the UI remains useful offline.

---

## Running Locally

### Backend API
```bash
cd backend
npm install
npm start          # launches on http://localhost:3001
```

The backend initializes the SQLite database (`phanta.db`) on first run and logs key endpoints, including a health probe at `/api/health`.

### Frontend App
```bash
cd frontend
npm install
npm run dev        # serves the React app on http://localhost:5173
```

Visit `http://localhost:5173`, connect your Phantom wallet, and follow the onboarding prompts. The frontend hits the backend REST API at `http://localhost:3001` by default (update `frontend/src/services/api.js` if deploying elsewhere).

---

## API Surface
| Method | Route                                   | Description |
|--------|-----------------------------------------|-------------|
| POST   | `/api/auth/check-user`                  | Detect existing wallet profiles |
| POST   | `/api/auth/onboard`                     | Create a new user linked to a wallet + portfolio tag |
| GET    | `/api/finance/overview/:wallet`         | Return real portfolio overview with on-chain data |
| GET    | `/api/finance/portfolio/:wallet`       | Get real-time Solana portfolio with risk analysis |
| GET    | `/api/finance/transactions/:wallet`     | Return real on-chain transaction history |
| POST   | `/api/finance/ai-suggestions`           | Chat endpoint with real portfolio context |
| POST   | `/api/finance/quote`                    | Get Jupiter swap quotes for trading |
| POST   | `/api/orders/...`                        | Schedule automation strategies (currently scaffolded) |

---

## AI Copilot Flow
1. Frontend posts prompts, historical messages, wallet context, and optional overview snapshots to `/api/finance/ai-suggestions`.
2. `financeService` assembles system instructions, generation config, and safety settings before calling `generateContent` in `geminiClient`.
3. `geminiClient` targets the configured model (default `gemini-2.5-flash`) and handles transport via native `fetch` or Node's `https`.
4. Responses are normalized into `{ message, note, meta, context }` payloads. If Gemini is unreachable or returns an empty candidate, curated fallback suggestions are injected instead of failing the chat experience.

---

## Development Tips
- **Database Resets** – Use the helper functions in `backend/database.js` or the provided seed scripts to reset sample data.
- **Static Analysis** – Add your preferred linter/prettier setup; the project intentionally stays lightweight.
- **Testing** – Endpoints are simple enough for supertest or MSW harnesses; consider adding regression coverage as you move beyond the MVP.
- **Environment Safety** – `loadEnv` only sets values when they are missing, so explicitly exporting variables in your shell will override `.env` entries.

---

## 🏆 Hackathon Features

✅ **Real On-Chain Data** - Actual Solana blockchain integration
✅ **Live Token Prices** - Real-time USD valuations via Jupiter
✅ **AI Portfolio Analysis** - Gemini analyzes your real holdings
✅ **Risk Scoring** - Automatic 0-100 risk assessment
✅ **24h PnL Tracking** - Real profit/loss calculations
✅ **Trading Recommendations** - AI-powered optimization suggestions
✅ **Production-Ready UI** - Polished, modern interface

See `HACKATHON_FEATURES.md` for complete feature list.

## Roadmap Ideas
1. Historical PnL tracking with price history
2. Transaction simulation before execution
3. Automated rebalancing alerts
4. Multi-wallet portfolio aggregation
5. DeFi yield optimization suggestions
6. Tax reporting and CSV exports

---

## License
This MVP is provided for experimentation and product exploration. Use at your own discretion.

