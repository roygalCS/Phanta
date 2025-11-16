const express = require('express');
const router = express.Router();
const { runQuery, runQuerySingle, runQueryExecute } = require('../database');

// Get user's groups
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Get groups where user is owner or member
    const groups = await runQuery(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
        (SELECT SUM(gm.deposit) FROM group_members gm WHERE gm.group_id = g.id) as total_deposited
      FROM groups g
      WHERE g.owner = ? OR EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.group_id = g.id AND gm.member_address = ?
      )
      ORDER BY g.created_at DESC
    `, [walletAddress, walletAddress]);

    res.json({
      success: true,
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        groupAddress: g.group_address,
        joinCode: g.join_code,
        owner: g.owner,
        requiredDeposit: g.required_deposit,
        memberCount: g.member_count || 0,
        totalDeposited: g.total_deposited || 0,
        status: g.status,
        createdAt: g.created_at,
      }))
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
});

// Create group
router.post('/create', async (req, res) => {
  try {
    const { groupAddress, owner, name, requiredDeposit, email } = req.body;

    if (!groupAddress || !owner || !name || !requiredDeposit) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Generate a short join code
    const joinCode = `PHANTA-${Date.now().toString().slice(-6)}`;

    // Create group
    const result = await runQueryExecute(`
      INSERT INTO groups (group_address, join_code, owner, name, required_deposit, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
    `, [groupAddress, joinCode, owner, name, requiredDeposit]);

    const groupId = result.id;

    // Add owner as first member
    await runQueryExecute(`
      INSERT INTO group_members (group_id, member_address, email, deposit, joined_at)
      VALUES (?, ?, ?, 0, datetime('now'))
    `, [groupId, owner, email]);

    res.json({
      success: true,
      group: {
        id: groupId,
        name,
        groupAddress,
        joinCode,
        owner,
        requiredDeposit,
        memberCount: 1,
        totalDeposited: 0,
        status: 'active',
      }
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, message: 'Failed to create group' });
  }
});

// Join group
router.post('/join', async (req, res) => {
  try {
    const { groupAddress, joinCode, member, email, deposit } = req.body;

    if ((!groupAddress && !joinCode) || !member || !deposit) {
      return res.status(400).json({ success: false, message: 'Missing required fields (need groupAddress or joinCode)' });
    }

    // Get group by address or join code
    let group;
    if (groupAddress) {
      group = await runQuerySingle(`SELECT * FROM groups WHERE group_address = ?`, [groupAddress]);
    } else if (joinCode) {
      group = await runQuerySingle(`SELECT * FROM groups WHERE join_code = ?`, [joinCode.toUpperCase()]);
    } else {
      return res.status(400).json({ success: false, message: 'Either groupAddress or joinCode is required' });
    }

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Use the resolved group address for on-chain operations
    const resolvedGroupAddress = group.group_address;

    // Check if already a member
    const existingMember = await runQuerySingle(`
      SELECT * FROM group_members 
      WHERE group_id = ? AND member_address = ?
    `, [group.id, member]);

    if (existingMember) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    // Add member
    await runQueryExecute(`
      INSERT INTO group_members (group_id, member_address, email, deposit, joined_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [group.id, member, email, deposit]);

    // Check majority (simple: if deposits >= required * 2, majority reached)
    const totalDeposited = await runQuerySingle(`
      SELECT SUM(deposit) as total FROM group_members WHERE group_id = ?
    `, [group.id]);

    const majorityThreshold = group.required_deposit * 2; // Simple majority logic
    if (totalDeposited.total >= majorityThreshold) {
      await runQueryExecute(`
        UPDATE groups SET status = 'majority_reached' WHERE id = ?
      `, [group.id]);
    }

    res.json({ 
      success: true, 
      message: 'Joined group successfully',
      groupAddress: resolvedGroupAddress, // Return resolved address for on-chain operations
      group: {
        id: group.id,
        name: group.name,
        groupAddress: resolvedGroupAddress,
        joinCode: group.join_code,
      }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ success: false, message: 'Failed to join group' });
  }
});

// Get group details
router.get('/:groupAddress', async (req, res) => {
  try {
    const { groupAddress } = req.params;

    const group = await runQuerySingle(`
      SELECT g.*,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
        (SELECT SUM(gm.deposit) FROM group_members gm WHERE gm.group_id = g.id) as total_deposited
      FROM groups g
      WHERE g.group_address = ?
    `, [groupAddress]);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const members = await runQuery(`
      SELECT * FROM group_members WHERE group_id = ? ORDER BY joined_at DESC
    `, [group.id]);

    res.json({
      success: true,
      group: {
        ...group,
        members: members.map(m => ({
          address: m.member_address,
          name: m.member_name || null,
          email: m.email,
          deposit: m.deposit,
          joinedAt: m.joined_at,
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch group' });
  }
});

// Get group members with portfolio data
router.get('/:groupAddress/members', async (req, res) => {
  try {
    const { groupAddress } = req.params;
    const solanaPortfolioService = require('../services/solanaPortfolioService');

    const group = await runQuerySingle(`
      SELECT * FROM groups WHERE group_address = ?
    `, [groupAddress]);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const members = await runQuery(`
      SELECT * FROM group_members WHERE group_id = ? ORDER BY joined_at DESC
    `, [group.id]);

    // Fetch portfolio data for each member
    const membersWithPortfolios = await Promise.all(
      members.map(async (member) => {
        try {
          const portfolio = await solanaPortfolioService.getPortfolio(member.member_address);
          return {
            address: member.member_address,
            name: member.member_name || null,
            email: member.email,
            deposit: member.deposit,
            joinedAt: member.joined_at,
            portfolio: {
              totalValue: portfolio.totalValue || 0,
              holdings: portfolio.holdings || [],
              solBalance: portfolio.solBalance || 0
            }
          };
        } catch (error) {
          console.error(`Error fetching portfolio for ${member.member_address}:`, error);
          return {
            address: member.member_address,
            name: member.member_name || null,
            email: member.email,
            deposit: member.deposit,
            joinedAt: member.joined_at,
            portfolio: {
              totalValue: 0,
              holdings: [],
              solBalance: 0
            }
          };
        }
      })
    );

    res.json({
      success: true,
      members: membersWithPortfolios
    });
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
});

// Add member to group (manual add with name)
router.post('/:groupAddress/add-member', async (req, res) => {
  try {
    const { groupAddress } = req.params;
    const { memberAddress, memberName, email } = req.body;

    if (!memberAddress || !memberName) {
      return res.status(400).json({ success: false, message: 'memberAddress and memberName are required' });
    }

    const group = await runQuerySingle(`
      SELECT * FROM groups WHERE group_address = ?
    `, [groupAddress]);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if already a member
    const existingMember = await runQuerySingle(`
      SELECT * FROM group_members 
      WHERE group_id = ? AND member_address = ?
    `, [group.id, memberAddress]);

    if (existingMember) {
      return res.status(400).json({ success: false, message: `This wallet address is already a member of the group${existingMember.member_name ? ` (${existingMember.member_name})` : ''}` });
    }

    // Add member with name
    await runQueryExecute(`
      INSERT INTO group_members (group_id, member_address, member_name, email, deposit, joined_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `, [group.id, memberAddress, memberName, email || null]);

    res.json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ success: false, message: 'Failed to add member' });
  }
});

module.exports = router;

