use anchor_lang::prelude::*;

declare_id!("PhantGrp1111111111111111111111111111111111");

#[program]
pub mod phanta_groups {
    use super::*;

    pub fn create_group(
        ctx: Context<CreateGroup>,
        required_deposit: u64,
    ) -> Result<()> {
        let group = &mut ctx.accounts.group;
        group.owner = ctx.accounts.owner.key();
        group.required_deposit = required_deposit;
        group.total_deposited = 0;
        group.member_count = 0;
        group.status = GroupStatus::Active;
        group.bump = ctx.bumps.group;
        
        msg!("Group created by {} with required deposit: {}", group.owner, required_deposit);
        Ok(())
    }

    pub fn join_group(ctx: Context<JoinGroup>, deposit: u64) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let member = &ctx.accounts.member;

        // Verify deposit amount matches required
        require!(
            deposit >= group.required_deposit,
            PhantaGroupsError::InsufficientDeposit
        );

        // Check if group is still active
        require!(
            group.status == GroupStatus::Active,
            PhantaGroupsError::GroupClosed
        );

        // Transfer deposit from member to group
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &member.key(),
                &group.key(),
                deposit,
            ),
            &[
                member.to_account_info(),
                group.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update group state
        group.total_deposited = group.total_deposited
            .checked_add(deposit)
            .ok_or(PhantaGroupsError::Overflow)?;
        group.member_count = group.member_count
            .checked_add(1)
            .ok_or(PhantaGroupsError::Overflow)?;

        msg!(
            "Member {} joined group. Total deposited: {}, Members: {}",
            member.key(),
            group.total_deposited,
            group.member_count
        );

        Ok(())
    }

    pub fn check_majority(ctx: Context<CheckMajority>) -> Result<()> {
        let group = &mut ctx.accounts.group;
        
        // Calculate majority threshold (51% of required deposit * expected members)
        // For simplicity, we'll use a fixed threshold
        let majority_threshold = group.required_deposit
            .checked_mul(3)
            .ok_or(PhantaGroupsError::Overflow)?; // Assume 3 members = majority
        
        if group.total_deposited >= majority_threshold {
            group.status = GroupStatus::MajorityReached;
            msg!("Majority reached! Total: {}, Threshold: {}", group.total_deposited, majority_threshold);
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateGroup<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Group::LEN,
        seeds = [b"group", owner.key().as_ref()],
        bump
    )]
    pub group: Account<'info, Group>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGroup<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,
    
    #[account(mut)]
    pub member: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckMajority<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,
}

#[account]
pub struct Group {
    pub owner: Pubkey,
    pub required_deposit: u64,
    pub total_deposited: u64,
    pub member_count: u8,
    pub status: GroupStatus,
    pub bump: u8,
}

impl Group {
    pub const LEN: usize = 32 + 8 + 8 + 1 + 1 + 1; // owner + required + total + count + status + bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GroupStatus {
    Active,
    MajorityReached,
    Closed,
}

#[error_code]
pub enum PhantaGroupsError {
    #[msg("Deposit amount is insufficient")]
    InsufficientDeposit,
    #[msg("Group is closed")]
    GroupClosed,
    #[msg("Arithmetic overflow")]
    Overflow,
}

