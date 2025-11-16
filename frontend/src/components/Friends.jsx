import React, { useState, useMemo } from 'react';
import { useWallet } from '../WalletContext';
import apiService from '../services/api';
import { useToast } from '../hooks/useToast';
import { FAKE_FRIENDS } from '../services/friendsService';

// Use friends data from service
const FRIENDS_LIST = FAKE_FRIENDS;

const Friends = () => {
  const { account } = useWallet();
  const { success, error } = useToast();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const handleViewProfile = (friend) => {
    if (friend.status === 'private') {
      setSelectedFriend(friend);
      setShowRequestModal(true);
      return;
    }
    setSelectedFriend(friend);
  };

  const handleSendRequest = async () => {
    if (!selectedFriend) return;
    
    setRequestSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRequestSending(false);
    setShowRequestModal(false);
    success(`Access request sent to ${selectedFriend.name}!`);
    setSelectedFriend(null);
  };

  const handleCancelRequest = () => {
    setShowRequestModal(false);
    setSelectedFriend(null);
    setRequestSending(false);
  };

  const handleAddToGroup = async (friend) => {
    setSelectedFriend(friend);
    setLoadingGroups(true);
    try {
      const response = await apiService.getUserGroups(account);
      setGroups(response.groups || []);
      setShowGroupSelectModal(true);
    } catch (error) {
      error('Failed to load groups. Please try again.');
      console.error('Error loading groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSelectGroup = async (group) => {
    if (!selectedFriend) return;
    
    try {
      // Copy wallet address to clipboard and show success
      navigator.clipboard.writeText(selectedFriend.walletAddress);
      success(`${selectedFriend.name}'s wallet address copied! Use it to add them to "${group.name}" in the Groups tab.`);
      setShowGroupSelectModal(false);
      setSelectedFriend(null);
    } catch (err) {
      error('Failed to copy address. Please try again.');
    }
  };

  const handleCloseProfile = () => {
    setSelectedFriend(null);
    setShowAddToGroup(false);
    setShowGroupSelectModal(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Request Access Modal
  if (showRequestModal && selectedFriend && selectedFriend.status === 'private') {
    return (
      <div className="px-[5vw] py-10 bg-black text-indigo-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleCancelRequest}
            className="mb-6 text-indigo-300 hover:text-indigo-100 transition-colors flex items-center gap-2"
          >
            ← Back to Friends
          </button>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">{selectedFriend.avatar}</div>
              <div>
                <h2 className="text-3xl font-bold text-indigo-100 mb-1">{selectedFriend.name}</h2>
                <p className="text-indigo-300/70 text-sm mb-2">{selectedFriend.bio}</p>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/40">
                  Private
                </span>
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-6 mb-6">
              <p className="text-indigo-200 text-center mb-2">
                This profile is private. Send a request to view {selectedFriend.name}'s portfolio?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelRequest}
                className="flex-1 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-200 px-6 py-3 rounded-xl font-medium transition-colors"
                disabled={requestSending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                className="flex-1 bg-indigo-500/30 border border-indigo-500/40 hover:bg-indigo-500/40 text-indigo-100 px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={requestSending}
              >
                {requestSending ? 'Request Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFriend && !showAddToGroup) {
    return (
      <div className="px-[5vw] py-10 bg-black text-indigo-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleCloseProfile}
            className="mb-6 text-indigo-300 hover:text-indigo-100 transition-colors flex items-center gap-2"
          >
            ← Back to Friends
          </button>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{selectedFriend.avatar}</div>
                <div>
                  <h2 className="text-3xl font-bold text-indigo-100 mb-1">{selectedFriend.name}</h2>
                  <p className="text-indigo-300/70 text-sm mb-2">{selectedFriend.bio}</p>
                  <p className="text-indigo-400/60 text-xs font-mono">
                    {selectedFriend.walletAddress.slice(0, 8)}...{selectedFriend.walletAddress.slice(-8)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedFriend.status === 'public' 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/40' 
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
                }`}>
                  {selectedFriend.status === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                <p className="text-xs text-indigo-300/70 mb-1">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-indigo-100">{formatCurrency(selectedFriend.portfolio.totalValue)}</p>
              </div>
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                <p className="text-xs text-indigo-300/70 mb-1">24h P&L</p>
                <p className={`text-2xl font-bold ${selectedFriend.portfolio.pnl24h >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                  {formatCurrency(selectedFriend.portfolio.pnl24h)} ({formatPercent(selectedFriend.portfolio.pnl24hPercent)})
                </p>
              </div>
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                <p className="text-xs text-indigo-300/70 mb-1">Risk Score</p>
                <p className="text-2xl font-bold text-indigo-100">{selectedFriend.portfolio.riskScore}/100</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-100 mb-4">Holdings</h3>
              <div className="space-y-2">
                {selectedFriend.portfolio.tokens.map((token, index) => (
                  <div
                    key={index}
                    className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-indigo-100 font-medium">{token.symbol}</p>
                      <p className="text-sm text-indigo-300/70">{token.amount.toLocaleString()}</p>
                    </div>
                    <p className="text-indigo-100 font-semibold">{formatCurrency(token.usdValue)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAddToGroup(selectedFriend)}
                className="flex-1 bg-indigo-500/30 border border-indigo-500/40 hover:bg-indigo-500/40 text-indigo-100 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Add to Group
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedFriend.walletAddress);
                  success('Wallet address copied!');
                }}
                className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-200 rounded-xl font-medium transition-colors"
              >
                Copy Address
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showAddToGroup && selectedFriend) {
    return (
      <div className="px-[5vw] py-10 bg-black text-indigo-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleCloseProfile}
            className="mb-6 text-indigo-300 hover:text-indigo-100 transition-colors flex items-center gap-2"
          >
            ← Back to Profile
          </button>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">
              Add {selectedFriend.name} to Group
            </h2>
            <p className="text-indigo-300/70 text-sm mb-6">
              Select a group to add {selectedFriend.name} ({selectedFriend.walletAddress.slice(0, 8)}...{selectedFriend.walletAddress.slice(-8)})
            </p>
            <div className="space-y-4">
              <p className="text-indigo-200 text-sm">
                To add {selectedFriend.name} to a group, go to the Groups tab and use their wallet address:
              </p>
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                <p className="text-xs text-indigo-300/70 mb-2">Wallet Address:</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-indigo-100 font-mono flex-1 break-all">
                    {selectedFriend.walletAddress}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedFriend.walletAddress);
                      success('Wallet address copied!');
                    }}
                    className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={handleCloseProfile}
                className="w-full bg-indigo-500/30 border border-indigo-500/40 hover:bg-indigo-500/40 text-indigo-100 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Back to Friends
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group Selection Modal
  if (showGroupSelectModal && selectedFriend) {
    return (
      <div className="px-[5vw] py-10 bg-black text-indigo-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setShowGroupSelectModal(false);
              setSelectedFriend(null);
            }}
            className="mb-6 text-indigo-300 hover:text-indigo-100 transition-colors flex items-center gap-2"
          >
            ← Back to Friends
          </button>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-indigo-100 mb-2">
                Add {selectedFriend.name} to Group
              </h2>
              <p className="text-indigo-300/70 text-sm">
                Select a group to add {selectedFriend.name} ({selectedFriend.walletAddress.slice(0, 8)}...{selectedFriend.walletAddress.slice(-8)})
              </p>
            </div>

            {groups.length === 0 ? (
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-indigo-200 font-medium mb-2">No groups yet</p>
                <p className="text-sm text-indigo-300/70 mb-6">Create a group first to add friends</p>
                <button
                  onClick={() => {
                    setShowGroupSelectModal(false);
                    setSelectedFriend(null);
                  }}
                  className="px-6 py-3 bg-indigo-500/30 border border-indigo-500/40 hover:bg-indigo-500/40 text-indigo-100 rounded-xl font-medium transition-colors"
                >
                  Back to Friends
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className="w-full bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 hover:border-indigo-500/20 rounded-xl p-4 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-indigo-100 font-semibold mb-1">{group.name}</h3>
                        <p className="text-xs text-indigo-300/70">
                          {group.memberCount || 0} members • {group.totalDeposited || 0} SOL
                        </p>
                      </div>
                      <span className="text-indigo-400">→</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-indigo-300/70 mb-2">Wallet Address:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-indigo-100 font-mono flex-1 break-all">
                  {selectedFriend.walletAddress}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedFriend.walletAddress);
                    success('Wallet address copied!');
                  }}
                  className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowGroupSelectModal(false);
                setSelectedFriend(null);
              }}
              className="w-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-200 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[5vw] py-10 bg-black text-indigo-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-100 mb-2">Friends</h1>
          <p className="text-indigo-300/70">View and manage your blockchain network</p>
        </div>

        {FRIENDS_LIST.length === 0 ? (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-indigo-100 mb-2">No Friends Yet</h3>
            <p className="text-indigo-300/70 mb-4">
              In production, you'll be able to add friends and compare portfolios.
            </p>
            <p className="text-sm text-indigo-400/60">
              For localhost, friends can be added manually through the Groups feature.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FRIENDS_LIST.map((friend) => (
            <div
              key={friend.id}
              className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{friend.avatar}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-100 mb-1">{friend.name}</h3>
                    <p className="text-sm text-indigo-300/70 mb-1">{friend.bio}</p>
                    <p className="text-xs text-indigo-400/60 font-mono">
                      {friend.walletAddress.slice(0, 8)}...{friend.walletAddress.slice(-8)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  friend.status === 'public' 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/40' 
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
                }`}>
                  {friend.status === 'public' ? 'Public' : 'Private'}
                </span>
              </div>

              {friend.status === 'public' ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
                      <p className="text-xs text-indigo-300/70 mb-1">Portfolio Value</p>
                      <p className="text-lg font-bold text-indigo-100">{formatCurrency(friend.portfolio.totalValue)}</p>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
                      <p className="text-xs text-indigo-300/70 mb-1">24h P&L</p>
                      <p className={`text-lg font-bold ${friend.portfolio.pnl24h >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                        {formatPercent(friend.portfolio.pnl24hPercent)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewProfile(friend)}
                      className="flex-1 bg-indigo-500/30 border border-indigo-500/40 hover:bg-indigo-500/40 text-indigo-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleAddToGroup(friend)}
                      className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-200 rounded-xl text-sm font-medium transition-colors"
                    >
                      Add to Group
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-center">
                  <p className="text-indigo-300/70 text-sm mb-3">Profile is private</p>
                  <button
                    onClick={() => handleViewProfile(friend)}
                    className="w-full px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-200 rounded-xl text-sm font-medium transition-colors"
                  >
                    Request Access
                  </button>
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;

