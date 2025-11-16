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

    // Create group
    const result = await runQueryExecute(`
      INSERT INTO groups (group_address, owner, name, required_deposit, status, created_at)
      VALUES (?, ?, ?, ?, 'active', datetime('now'))
    `, [groupAddress, owner, name, requiredDeposit]);

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
    const { groupAddress, member, email, deposit } = req.body;

    if (!groupAddress || !member || !deposit) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get group
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

    res.json({ success: true, message: 'Joined group successfully' });
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

module.exports = router;

