# Phanta – AI-Powered Crypto Banking Assistant

**Phanta** is an AI-first crypto banking experience powered by **Google Gemini** that turns your Phantom wallet into an intelligent portfolio management system. Built with real Solana on-chain data, live token prices, and Gemini AI insights. Get real-time portfolio tracking, risk analysis, and actionable trading recommendations powered by your actual wallet data.

---

## Overview

- **Audience** – Crypto-native investors and advisors who want a banking console that understands wallets instead of checking accounts.
- **Value** – Unified balances, interactive analytics, and an embedded AI analyst powered by Google Gemini that stays useful even when offline.
- **Stack** – React 19 + Vite frontend, Express + SQLite backend, **Google Gemini 2.5 Flash** for natural-language insights.

---

## Feature Tour

- **Real On-Chain Data** – Live Solana portfolio tracking via Helius API, real token balances and prices via Jupiter API
- **AI-Powered Assistant** – **Google Gemini AI** analyzes your real portfolio, provides risk analysis, and suggests optimizations
- **24h PnL Tracking** – Real-time profit/loss calculations with percentage changes
- **Risk Analysis** – Automatic risk scoring (0-100) with concentration warnings and recommendations
- **Portfolio Holdings** – See all your tokens with live USD values and allocation percentages
- **Trading Recommendations** – Gemini AI suggests rebalancing, diversification, and risk management strategies
- **Transaction History** – Real on-chain transaction log from your wallet
- **Group Chat** – Create groups, invite members, and use `@gemini` to add AI to conversations
- **Modern UI** – Gemini dark mode minimalistic interface, AI-first design

---

## Architecture at a Glance

```
phanta/
├── backend/                      # Express API and services
│   ├── config/loadEnv.js         # Layered dotenv loader for backend/.env
│   ├── database.js               # SQLite helpers + schema bootstrap
│   ├── routes/
│   │   ├── auth.js               # Wallet onboarding + profile lookups
│   │   ├── finance.js            # Portfolio, transactions, Gemini chat proxy
│   │   ├── groups.js             # Group management endpoints
│   │   └── health.js              # Health check + API key status
│   └── services/
│       ├── financeService.js     # Portfolio data, Gemini AI orchestration
│       ├── geminiClient.js       # Gemini REST client (2.5 Flash default)
│       ├── solanaPortfolioService.js  # Real Solana portfolio tracking
│       ├── heliusService.js     # Helius API integration
│       └── jupiterService.js     # Jupiter price API
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app component
│   │   ├── Dashboard.jsx         # Main signed-in experience
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Main layout with navigation
│   │   │   ├── AIAssistantPanel.jsx  # Gemini-powered chat interface
│   │   │   ├── GroupManager.jsx  # Group creation and management
│   │   │   ├── GroupChat.jsx     # Group chat with @gemini mentions
│   │   │   └── PhantaLogo.jsx    # Animated Phanta bottle logo
│   │   └── services/api.js       # REST client targeting the backend
│   └── package.json
└── README.md
```

### Backend Highlights

- Express API with modular routes (auth, finance, groups, health).
- **Real Solana Integration** – Helius API for wallet indexing, Jupiter API for prices
- **Portfolio Service** – Real-time portfolio tracking with PnL calculations
- **Risk Analysis Engine** – Automatic risk scoring and warnings
- **Google Gemini Integration** – Full AI assistant powered by Gemini 2.5 Flash
- SQLite storage via `database.js` with helpers for queries and seeding.
- `financeService` integrates real portfolio data with Gemini AI insights
- `geminiClient` wraps the Generative Language API with transport fallbacks

### Frontend Highlights

- React 19 + Vite + Tailwind CSS for fast iteration.
- **Gemini Dark Mode UI** – True black background, minimalistic design matching Google Gemini
- Dashboard experience clusters portfolio metrics, charts, market intel, and the Gemini AI copilot.
- **Group Features** – Create groups, invite members, chat with `@gemini` mentions
- Componentized layout enables swapping data sources without reworking the entire shell.

---

## Environment Configuration

Phanta reads environment variables through `backend/config/loadEnv.js`, which loads from `backend/.env`.

**Backend (`backend/.env`):**
```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Google Gemini API (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Enhanced Solana data
HELIUS_API_KEY=your_helius_key_here

# Optional: Gemini Configuration
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.25
GEMINI_MAX_OUTPUT_TOKENS=768
GEMINI_TOP_P=0.9
GEMINI_SAFETY_THRESHOLD=BLOCK_MEDIUM_AND_ABOVE
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

> **Get your Gemini API key:** Visit https://aistudio.google.com/app/apikey to create a free API key.

---

## Running Locally

### Prerequisites

- Node.js 18+ installed
- Phantom wallet browser extension
- Google Gemini API key (free tier available)

### Backend API

```bash
cd backend
npm install
npm start          # launches on http://localhost:3001
```

The backend initializes the SQLite database (`phanta.db`) on first run and logs key endpoints, including a health probe at `/api/health` and API key status at `/api/health/api-keys`.

### Frontend App

```bash
cd frontend
npm install
npm run dev        # serves the React app on http://localhost:5173
```

Visit `http://localhost:5173`, connect your Phantom wallet, and follow the onboarding prompts. The frontend hits the backend REST API at `http://localhost:3001` by default.

---

## API Surface

| Method | Route                                   | Description |
|--------|-----------------------------------------|-------------|
| GET    | `/api/health`                           | Backend health check |
| GET    | `/api/health/api-keys`                  | Check Gemini API key status |
| POST   | `/api/auth/check-user`                  | Detect existing wallet profiles |
| POST   | `/api/auth/onboard`                     | Create a new user linked to a wallet |
| GET    | `/api/finance/overview/:wallet`         | Return real portfolio overview with on-chain data |
| GET    | `/api/finance/portfolio/:wallet`        | Get real-time Solana portfolio with risk analysis |
| GET    | `/api/finance/transactions/:wallet`     | Return real on-chain transaction history |
| POST   | `/api/finance/ai-suggestions`           | Chat endpoint with Gemini AI (real portfolio context) |
| POST   | `/api/finance/quote`                    | Get Jupiter swap quotes for trading |
| GET    | `/api/groups/user/:wallet`              | Get user's groups |
| POST   | `/api/groups/create`                    | Create a new group |
| POST   | `/api/groups/join`                      | Join a group |

---

## Gemini AI Integration

Phanta is powered entirely by **Google Gemini 2.5 Flash**. The AI assistant:

1. **Analyzes Real Portfolios** – Gemini receives your actual Solana wallet data including token balances, prices, and 24h PnL
2. **Provides Risk Analysis** – AI calculates risk scores and provides warnings about concentration
3. **Suggests Optimizations** – Gemini recommends rebalancing, diversification, and yield strategies
4. **Group Chat Support** – Use `@gemini` in group chats to add AI to conversations
5. **Offline Fallback** – Curated suggestions when Gemini is unavailable

### How It Works

1. Frontend posts prompts, historical messages, wallet context, and portfolio snapshots to `/api/finance/ai-suggestions`.
2. `financeService` assembles system instructions with real portfolio data, generation config, and safety settings before calling `generateContent` in `geminiClient`.
3. `geminiClient` targets Gemini 2.5 Flash and handles transport via native `fetch` or Node's `https`.
4. Responses are normalized into `{ message, note, meta, context }` payloads. If Gemini is unreachable, curated fallback suggestions are injected instead of failing the chat experience.

---

## Group Features

Phanta includes on-chain group functionality:

- **Create Groups** – Owners can create groups with required deposit amounts
- **Join Groups** – Members join using email and deposit SOL
- **Group Chat** – Members can chat and use `@gemini` to add AI to conversations
- **On-Chain State** – Group data stored on Solana via Program Derived Addresses (PDAs)

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
✅ **AI Portfolio Analysis** - Google Gemini analyzes your real holdings  
✅ **Risk Scoring** - Automatic 0-100 risk assessment  
✅ **24h PnL Tracking** - Real profit/loss calculations  
✅ **Trading Recommendations** - Gemini-powered optimization suggestions  
✅ **Group Chat** - On-chain groups with AI integration  
✅ **Production-Ready UI** - Polished Gemini dark mode interface  

---

## Roadmap Ideas

1. Historical PnL tracking with price history
2. Transaction simulation before execution
3. Automated rebalancing alerts
4. Multi-wallet portfolio aggregation
5. DeFi yield optimization suggestions
6. Tax reporting and CSV exports
7. Advanced Gemini features (multimodal, function calling)

---

## License

This MVP is provided for experimentation and product exploration. Use at your own discretion.

---

## Support

For issues or questions, please open an issue on GitHub or contact the maintainers.

**Built with ❤️ using Google Gemini AI**
