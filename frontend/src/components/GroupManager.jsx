import React, { useState, useEffect } from 'react';
import { useWallet } from '../WalletContext';
import { createGroup, joinGroup } from '../services/groupService';
import GroupChat from './GroupChat';
import apiService from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from './ToastContainer';

const GroupManager = () => {
  const { account, publicKey, connection } = useWallet();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0);
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  const [createForm, setCreateForm] = useState({
    name: '',
    requiredDeposit: '0.1',
    email: '',
  });

  const [joinForm, setJoinForm] = useState({
    groupAddress: '',
    joinCode: '',
    email: '',
    deposit: '0.1',
  });

  const [addMemberForm, setAddMemberForm] = useState({
    memberAddress: '',
    memberName: '',
    email: '',
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

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    // Validate inputs
    if (!addMemberForm.memberName.trim()) {
      setError('Please enter a member name');
      showError('Please enter a member name');
      return;
    }

    if (!addMemberForm.memberAddress.trim()) {
      setError('Please enter a wallet address');
      showError('Please enter a wallet address');
      return;
    }

    // Basic Solana address validation (44 characters, base58)
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!solanaAddressRegex.test(addMemberForm.memberAddress.trim())) {
      setError('Please enter a valid Solana wallet address');
      showError('Please enter a valid Solana wallet address (32-44 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const memberName = addMemberForm.memberName.trim();
      const memberAddress = addMemberForm.memberAddress.trim();
      await apiService.addGroupMember(selectedGroup.groupAddress, {
        memberAddress: memberAddress,
        memberName: memberName,
        email: addMemberForm.email?.trim() || null,
      });

      setShowAddMemberModal(false);
      setAddMemberForm({ memberAddress: '', memberName: '', email: '' });
      // Reload groups to refresh member list
      await loadUserGroups();
      // Trigger GroupChat to refresh members
      setChatRefreshTrigger(prev => prev + 1);
      showSuccess(`Added ${memberName} to the group!`);
    } catch (err) {
      console.error('Error adding member:', err);
      let errorMsg = 'Failed to add member';
      if (err.message) {
        errorMsg = err.message;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
      showError(errorMsg);
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
      
      if (!joinForm.groupAddress && !joinForm.joinCode) {
        setError('Please enter either a join code or group address');
        setLoading(false);
        return;
      }

      // Join group in backend first (backend will resolve join code to address if needed)
      const backendResult = await apiService.joinGroup({
        groupAddress: joinForm.groupAddress || undefined,
        joinCode: joinForm.joinCode || undefined,
        member: account,
        email: joinForm.email,
        deposit: depositSol,
      });
      
      // Get the resolved group address from backend response
      const groupAddressToUse = backendResult.groupAddress || joinForm.groupAddress;
      
      // Join group on-chain if we have an address
      if (groupAddressToUse) {
        try {
          await joinGroup(
            publicKey,
            connection,
            groupAddressToUse,
            depositSol
          );
        } catch (onChainError) {
          console.warn('On-chain join failed, but backend join succeeded:', onChainError);
          // Continue - backend join was successful, on-chain can be retried later
        }
      }

      await loadUserGroups();
      setShowJoinModal(false);
      setJoinForm({ groupAddress: '', joinCode: '', email: '', deposit: '0.1' });
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
      <div className="h-full flex items-center justify-center bg-black text-gray-300">
        <p>Please connect your wallet to access groups</p>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div className="h-full flex flex-col">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
          <button
            onClick={() => setSelectedGroup(null)}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-200">{selectedGroup.name}</h3>
            {selectedGroup.joinCode && (
              <div className="flex items-center gap-2">
                <code className="text-xs bg-black/50 px-2 py-1 rounded border border-[#1f1f1f] text-purple-400 font-mono">
                  {selectedGroup.joinCode}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(selectedGroup.joinCode)}
                  className="text-xs text-gray-400 hover:text-white"
                  title="Copy join code"
                >
                  📋
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setError('');
              setShowAddMemberModal(true);
            }}
            className="px-3 py-1.5 bg-indigo-500/30 border border-indigo-500/40 text-indigo-100 rounded-lg text-xs hover:bg-indigo-500/40 transition-colors"
            title="Add a member to this group (they don't need to join - just add their wallet address and name)"
          >
            + Add Member
          </button>
        </div>
        <GroupChat 
          groupId={selectedGroup.id} 
          groupName={selectedGroup.name} 
          groupAddress={selectedGroup.groupAddress}
          refreshTrigger={chatRefreshTrigger}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black overflow-y-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
              className="px-4 py-2 bg-[#0f0f0f] border border-[#1f1f1f] text-gray-200 rounded-lg text-sm hover:bg-[#1a1a1a] transition-colors"
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
            <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-200 font-medium mb-2">No groups yet</p>
              <p className="text-sm text-gray-400 mb-6">Create or join a group to collaborate with others</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-[#1a73e8] text-white rounded-lg text-sm hover:bg-[#1557b0] transition-colors"
                >
                  Create Group
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-4 py-2 bg-[#0f0f0f] border border-[#1f1f1f] text-gray-200 rounded-lg text-sm hover:bg-[#1a1a1a] transition-colors"
                >
                  Join Group
                </button>
              </div>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4 hover:bg-[#1a1a1a] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">{group.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {group.memberCount || 0} members • {group.totalDeposited || 0} SOL
                    </p>
                    {group.joinCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Join ID:</span>
                        <code className="text-xs bg-black/50 px-2 py-1 rounded border border-[#1f1f1f] text-purple-400 font-mono">
                          {group.joinCode}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(group.joinCode);
                          }}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          📋
                        </button>
                      </div>
                    )}
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
          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Create Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Group Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a]"
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
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Your Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-black border border-[#1f1f1f] text-gray-200 rounded-lg text-sm hover:bg-[#0f0f0f]"
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
          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Join Group</h3>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Join Code (Easy Way)</label>
                <input
                  type="text"
                  value={joinForm.joinCode}
                  onChange={(e) => setJoinForm({ ...joinForm, joinCode: e.target.value.toUpperCase(), groupAddress: '' })}
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a] font-mono"
                  placeholder="PHANTA-123456"
                />
                <p className="text-xs text-gray-500 mt-1">Or use group address below</p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Group Address (Advanced)</label>
                <input
                  type="text"
                  value={joinForm.groupAddress}
                  onChange={(e) => setJoinForm({ ...joinForm, groupAddress: e.target.value, joinCode: '' })}
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a] font-mono text-xs"
                  placeholder="Enter group PDA address"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Your Email</label>
                <input
                  type="email"
                  value={joinForm.email}
                  onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a]"
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
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 bg-black border border-[#1f1f1f] text-gray-200 rounded-lg text-sm hover:bg-[#0f0f0f]"
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

      {/* Add Member Modal */}
      {showAddMemberModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Add Member to {selectedGroup.name}</h3>
            <p className="text-xs text-gray-400 mb-4">Add members by wallet address so Gemini can identify them and compare portfolios when you ask questions like "who's richest?"</p>
            {error && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 text-sm text-rose-200">
                {error}
              </div>
            )}
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Member Name</label>
                <input
                  type="text"
                  value={addMemberForm.memberName}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, memberName: e.target.value })}
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a]"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={addMemberForm.memberAddress}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, memberAddress: e.target.value })}
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a] font-mono text-xs"
                  placeholder="e.g., 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter a valid Solana wallet address (32-44 characters)</p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={addMemberForm.email}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })}
                  className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#2a2a2a]"
                  placeholder="member@example.com"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setAddMemberForm({ memberAddress: '', memberName: '', email: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-black border border-[#1f1f1f] text-gray-200 rounded-lg text-sm hover:bg-[#0f0f0f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#1a73e8] text-white rounded-lg text-sm hover:bg-[#1557b0] disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Member'}
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

