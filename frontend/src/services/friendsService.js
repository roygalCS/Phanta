// Friends service - exports fake friends data for use across the app
export const FAKE_FRIENDS = [
  {
    id: '1',
    name: 'Alex Chen',
    walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    avatar: '👨‍💻',
    status: 'public',
    portfolio: {
      totalValue: 87.50,
      solBalance: 0.47,
      tokens: [
        { symbol: 'SOL', amount: 0.47, usdValue: 87.00 },
        { symbol: 'USDC', amount: 0.50, usdValue: 0.50 }
      ],
      pnl24h: 1.25,
      pnl24hPercent: 1.45,
      riskScore: 35,
      holdingsCount: 2
    },
    lastActive: '2 hours ago',
    bio: 'DeFi enthusiast | Solana builder'
  },
  {
    id: '2',
    name: 'Sarah Martinez',
    walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    avatar: '👩‍💼',
    status: 'public',
    portfolio: {
      totalValue: 65.25,
      solBalance: 0.35,
      tokens: [
        { symbol: 'SOL', amount: 0.35, usdValue: 64.75 },
        { symbol: 'USDC', amount: 0.50, usdValue: 0.50 }
      ],
      pnl24h: -0.85,
      pnl24hPercent: -1.29,
      riskScore: 25,
      holdingsCount: 2
    },
    lastActive: '5 minutes ago',
    bio: 'NFT collector | Blockchain investor'
  },
  {
    id: '3',
    name: 'Jordan Kim',
    walletAddress: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    avatar: '🧑‍🎨',
    status: 'private',
    portfolio: {
      totalValue: 0,
      solBalance: 0,
      tokens: [],
      pnl24h: 0,
      pnl24hPercent: 0,
      riskScore: 0,
      holdingsCount: 0
    },
    lastActive: '1 day ago',
    bio: 'Privacy-focused investor'
  },
  {
    id: '4',
    name: 'Taylor Brown',
    walletAddress: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
    avatar: '👨‍🔬',
    status: 'public',
    portfolio: {
      totalValue: 113.00,
      solBalance: 0.61,
      tokens: [
        { symbol: 'SOL', amount: 0.61, usdValue: 112.85 },
        { symbol: 'USDC', amount: 0.15, usdValue: 0.15 }
      ],
      pnl24h: 2.15,
      pnl24hPercent: 1.94,
      riskScore: 25,
      holdingsCount: 2
    },
    lastActive: '30 minutes ago',
    bio: 'Crypto whale | Early adopter'
  }
];

export const getFriendsData = () => FAKE_FRIENDS;
export const getPublicFriends = () => FAKE_FRIENDS.filter(f => f.status === 'public');
export const getFriendByAddress = (address) => FAKE_FRIENDS.find(f => f.walletAddress === address);

