# Phanta

**AI-Powered Blockchain Portfolio Management Platform**

Phanta is a next-generation **blockchain-native** portfolio management platform that leverages **on-chain blockchain data**, Solana Program Derived Addresses (PDAs), and Google Gemini AI to provide intelligent portfolio analysis, risk assessment, and automated insights. Built entirely on **blockchain infrastructure**, Phanta brings the power of decentralized finance to portfolio management.

## 🌐 Blockchain-First Architecture

Phanta is built **entirely on blockchain infrastructure** - every feature leverages the power of decentralized blockchain technology:

- **Solana Blockchain**: All portfolio data is fetched directly from **on-chain blockchain sources**
- **Program Derived Addresses (PDAs)**: Group functionality uses Solana PDAs for **decentralized blockchain state management**
- **On-Chain Blockchain Data**: Real-time wallet balances, token holdings, and transaction history from the **Solana blockchain**
- **Smart Contract Integration**: Group deposits and membership tracked **on-chain via blockchain programs**
- **Decentralized Blockchain State**: Group accounts stored as PDAs on the **blockchain**, ensuring transparency and immutability

## 🔗 Core Blockchain Features

### On-Chain Blockchain Portfolio Tracking
- Real-time balance fetching from **Solana blockchain RPC endpoints**
- Token account analysis using **Solana's blockchain Token Program**
- Transaction history directly from **blockchain signatures**
- Multi-RPC endpoint support for **blockchain reliability**

### Solana Blockchain Program Integration
- **Group Management**: Create and join groups with **on-chain blockchain state**
- **PDA Accounts**: Group data stored in **Program Derived Addresses on the blockchain**
- **Deposit Tracking**: Member deposits tracked **on-chain via blockchain**
- **Majority Voting**: **On-chain blockchain logic** for group decisions

### Blockchain Data Sources
- **Helius API**: Enhanced **Solana blockchain** wallet indexing
- **Jupiter API**: Real-time token prices from **on-chain blockchain DEX aggregators**
- **Solana RPC**: Direct **blockchain queries** for balances and transactions
- **CoinGecko**: Market data for **blockchain assets**

## 🤖 AI-Powered Blockchain Insights

Powered by Google Gemini, Phanta provides **blockchain-native** intelligence:

- **Blockchain Portfolio Analysis**: AI-driven analysis of your **on-chain blockchain holdings**
- **Risk Assessment**: Intelligent risk scoring based on **blockchain data**
- **Trading Recommendations**: Data-driven suggestions for **blockchain portfolio** optimization
- **Group Chat AI**: Collaborative decision-making with AI assistance via `@gemini` mentions for **blockchain groups**

## 🏗️ Technical Stack

### Blockchain Layer
- **Solana Web3.js**: Direct blockchain interaction
- **Anchor Framework**: Solana program development
- **Phantom Wallet**: Native Solana wallet integration
- **RPC Endpoints**: Multiple Solana RPC providers for redundancy

### Frontend
- **React.js**: Modern UI framework
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Chart.js**: Data visualization

### Backend
- **Node.js/Express**: API server
- **SQLite**: Off-chain metadata storage
- **Google Gemini API**: AI-powered insights
- **Axios**: HTTP client for blockchain APIs

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Phantom wallet browser extension
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/roygalCS/Phanta.git
   cd Phanta
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   HELIUS_API_KEY=your_helius_key_optional
   PORT=3001
   ```

4. **Start the servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm start
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

5. **Connect your Phantom wallet**
   - Open http://localhost:5173
   - Click "Connect Phantom Wallet"
   - Approve the connection in Phantom

## 📊 Features

### Blockchain Portfolio Dashboard
- **Real-Time Blockchain Balances**: Live SOL and SPL token balances from **the blockchain**
- **On-Chain Blockchain Holdings**: All tokens tracked directly from your **blockchain wallet**
- **Blockchain Transaction History**: Complete **on-chain blockchain transaction** feed
- **24h PnL**: Calculated from **blockchain price data**

### Group Management (On-Chain Blockchain)
- **Create Groups**: Initialize **Solana blockchain PDA accounts** for groups
- **Join Groups**: Deposit SOL/SPL tokens to join **blockchain groups**
- **On-Chain Blockchain State**: All group data stored in **blockchain accounts**
- **Majority Logic**: **Blockchain-enforced** group decision rules

### AI Assistant
- **Blockchain Portfolio Analysis**: Gemini AI analyzes your **on-chain blockchain portfolio**
- **Risk Warnings**: AI identifies potential risks in **blockchain holdings**
- **Optimization Suggestions**: Data-driven recommendations for **blockchain assets**
- **Group Chat**: AI-powered **blockchain group** discussions

### Market Intelligence
- **Blockchain Analytics**: Market data and volatility analysis
- **Correlation Matrices**: Asset correlation from blockchain data
- **Regression Analysis**: Statistical analysis of price movements

## 🔐 Blockchain Security

- **Blockchain Wallet Integration**: Direct connection to Phantom **blockchain wallet**
- **No Private Keys**: Private keys never leave your **blockchain wallet**
- **On-Chain Blockchain Verification**: All transactions verified on **Solana blockchain**
- **Transparent Blockchain State**: Group data publicly verifiable **on-chain via blockchain**

## 🛠️ Development

### Project Structure
```
Phanta/
├── backend/
│   ├── routes/          # API routes
│   ├── services/        # Blockchain & AI services
│   ├── programs/        # Solana programs (Anchor)
│   └── database.js      # SQLite setup
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API clients
│   │   └── hooks/       # Custom React hooks
└── README.md
```

### Solana Program Development

The group functionality uses Solana programs:

```rust
// programs/phanta-groups/src/lib.rs
// GroupAccount PDA structure
pub struct GroupAccount {
    pub owner: Pubkey,
    pub members: Vec<Pubkey>,
    pub required_deposit: u64,
    pub total_deposited: u64,
    pub member_count: u8,
    pub status: bool,
}
```

### Blockchain Data Flow

1. **Blockchain Wallet Connection**: Phantom wallet connects via **Solana blockchain Web3.js**
2. **Blockchain RPC Queries**: Fetch balances, tokens, transactions from **Solana blockchain RPC**
3. **On-Chain Blockchain State**: Read group PDAs from **the blockchain**
4. **AI Blockchain Analysis**: Gemini analyzes **on-chain blockchain portfolio data**
5. **User Interface**: Display **blockchain data** in modern UI

## 🌟 Key Differentiators

- **100% Blockchain-Native**: All data sourced from **on-chain blockchain sources**
- **Solana Blockchain-First**: Built specifically for **Solana blockchain**
- **PDA-Based Blockchain Groups**: **Decentralized blockchain group** management
- **Real-Time On-Chain Blockchain Data**: Live **blockchain state updates**
- **AI + Blockchain**: Combines AI intelligence with **blockchain transparency**

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Links

- **GitHub**: https://github.com/roygalCS/Phanta
- **Solana Docs**: https://docs.solana.com
- **Phantom Wallet**: https://phantom.app
- **Google Gemini**: https://ai.google.dev

## 🙏 Acknowledgments

- Solana Foundation for blockchain infrastructure
- Phantom for wallet integration
- Google for Gemini AI
- Helius and Jupiter for blockchain data APIs

---

**Built on Solana. Powered by AI. Managed by You.**
