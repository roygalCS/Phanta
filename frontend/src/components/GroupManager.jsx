import React, { useState, useEffect } from 'react';
import { useWallet } from '../WalletContext';
import { createGroup, joinGroup } from '../services/groupService';
import GroupChat from './GroupChat';
import apiService from '../services/api';

const GroupManager = () => {
  const { account, publicKey, connection } = useWallet();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [createForm, setCreateForm] = useState({
    name: '',
    requiredDeposit: '0.1',
    email: '',
  });

  const [joinForm, setJoinForm] = useState({
    groupAddress: '',
    email: '',
    deposit: '0.1',
  });

  useEffect(() => {
    if (account) {
      loadUserGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const loadUserGroups = async () => {
    try {
      // Load groups from backend
      const response = await apiService.getUserGroups(account);
      setGroups(response.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      // Set empty array on error to prevent UI issues
      setGroups([]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requiredDepositSol = parseFloat(createForm.requiredDeposit);
      
      if (isNaN(requiredDepositSol) || requiredDepositSol <= 0) {
        setError('Please enter a valid deposit amount');
        setLoading(false);
        return;
      }
      
      // Create group on-chain
      const result = await createGroup(
        publicKey,
        connection,
        requiredDepositSol
      );

      // Create group in backend
      const backendResult = await apiService.createGroup({
        groupAddress: result.groupAddress,
        owner: account,
        name: createForm.name,
        requiredDeposit: requiredDepositSol,
        email: createForm.email,
      });

      setGroups((prev) => [...prev, backendResult.group]);
      setShowCreateModal(false);
      setCreateForm({ name: '', requiredDeposit: '0.1', email: '' });
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const depositSol = parseFloat(joinForm.deposit);
      
      if (isNaN(depositSol) || depositSol <= 0) {
        setError('Please enter a valid deposit amount');
        setLoading(false);
        return;
      }
      
      if (!joinForm.groupAddress || joinForm.groupAddress.trim() === '') {
        setError('Please enter a valid group address');
        setLoading(false);
        return;
      }
      
      // Join group on-chain
      await joinGroup(
        publicKey,
        connection,
        joinForm.groupAddress,
        depositSol
      );

      // Join group in backend
      await apiService.joinGroup({
        groupAddress: joinForm.groupAddress,
        member: account,
        email: joinForm.email,
        deposit: depositSol,
      });

      await loadUserGroups();
      setShowJoinModal(false);
      setJoinForm({ groupAddress: '', email: '', deposit: '0.1' });
    } catch (err) {
      console.error('Error joining group:', err);
      setError(err.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  // Handle missing wallet context gracefully
  if (!account) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0f0f0f] text-gray-400">
        <p>Please connect your wallet to access groups</p>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
          <button
            onClick={() => setSelectedGroup(null)}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h3 className="text-sm font-medium text-gray-200">{selectedGroup.name}</h3>
          <div />
        </div>
        <GroupChat groupId={selectedGroup.id} groupName={selectedGroup.name} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] overflow-y-auto">
      <div className="px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Groups</h2>
            <p className="text-sm text-gray-400">Create or join groups with on-chain deposits</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#1a73e8] text-white rounded-lg text-sm hover:bg-[#1557b0] transition-colors"
            >
              Create Group
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#252525] transition-colors"
            >
              Join Group
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Groups List */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No groups yet</p>
              <p className="text-xs mt-2">Create or join a group to get started</p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:bg-[#252525] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">{group.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {group.memberCount || 0} members • {group.totalDeposited || 0} SOL
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Required: {group.requiredDeposit} SOL</p>
                    <p className={`text-xs mt-1 ${
                      group.status === 'majority_reached' ? 'text-emerald-400' : 'text-gray-400'
                    }`}>
                      {group.status === 'majority_reached' ? 'Majority Reached' : 'Active'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Create Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Group Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3a3a3a]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Required Deposit (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.requiredDeposit}
                  onChange={(e) => setCreateForm({ ...createForm, requiredDeposit: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3a3a3a]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Your Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3a3a3a]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#1a1a1a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#1a73e8] text-white rounded-lg text-sm hover:bg-[#1557b0] disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Join Group</h3>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Group Address</label>
                <input
                  type="text"
                  value={joinForm.groupAddress}
                  onChange={(e) => setJoinForm({ ...joinForm, groupAddress: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3a3a3a]"
                  placeholder="Enter group PDA address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Your Email</label>
                <input
                  type="email"
                  value={joinForm.email}
                  onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3a3a3a]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Deposit Amount (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={joinForm.deposit}
                  onChange={(e) => setJoinForm({ ...joinForm, deposit: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3a3a3a]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#1a1a1a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#1a73e8] text-white rounded-lg text-sm hover:bg-[#1557b0] disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join & Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManager;

