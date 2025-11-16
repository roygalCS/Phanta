# Phanta Groups - On-Chain Group Deposits

## Overview

Phanta Groups enables users to create groups with on-chain Solana deposits. Members join by depositing SOL, and when a majority is reached, the group status updates on-chain.

## Architecture

### Solana Program (`programs/phanta-groups/`)

The Anchor program provides:

1. **GroupAccount PDA** - Stores group state on-chain:
   - `owner: Pubkey` - Group creator
   - `members: Vec<Pubkey>` - Member addresses
   - `required_deposit: u64` - Minimum deposit per member
   - `total_deposited: u64` - Total SOL deposited
   - `member_count: u8` - Number of members
   - `status: GroupStatus` - Active, MajorityReached, or Closed

2. **Instructions**:
   - `create_group(owner, required_deposit)` - Creates a new group PDA
   - `join_group(group, member, deposit)` - Member joins and deposits SOL
   - `check_majority(group)` - Checks if majority threshold is reached

### Frontend Components

- **GroupManager** (`frontend/src/components/GroupManager.jsx`) - Main UI for creating/joining groups
- **GroupChat** (`frontend/src/components/GroupChat.jsx`) - Group chat with @gemini mentions
- **groupService** (`frontend/src/services/groupService.js`) - Solana transaction helpers

### Backend API

- `GET /api/groups/user/:walletAddress` - Get user's groups
- `POST /api/groups/create` - Create group (stores metadata)
- `POST /api/groups/join` - Join group (tracks membership)
- `GET /api/groups/:groupAddress` - Get group details

## Features

✅ **On-Chain State** - Group data stored in Solana PDA  
✅ **Email Invites** - Members join using email addresses  
✅ **Deposit Tracking** - Real SOL deposits tracked on-chain  
✅ **Majority Detection** - Automatic status updates when threshold reached  
✅ **Group Chat** - Chat with @gemini mentions to add AI  
✅ **AI Provider Switching** - Switch between Gemini, ChatGPT, Claude  

## Building the Solana Program

```bash
cd programs/phanta-groups
anchor build
anchor deploy --provider.cluster devnet
```

Update `PROGRAM_ID` in `groupService.js` after deployment.

## Usage

1. **Create Group**: Owner sets required deposit amount
2. **Join Group**: Members deposit SOL to join
3. **Majority Check**: When deposits >= threshold, status updates
4. **Group Chat**: Members chat and mention @gemini for AI assistance

## Next Steps

- Deploy Solana program to devnet/mainnet
- Update PROGRAM_ID in frontend
- Add email notification service
- Implement actual AI provider API integrations (ChatGPT, Claude)
- Add group analytics and portfolio aggregation

