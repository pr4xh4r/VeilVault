use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod veilvault {
    use super::*;

    /// Initialize a new vault with initial supply and RWA proof
    pub fn initialize_vault(ctx: Context<InitializeVault>, initial_supply: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.user.key();
        vault.total_shares = initial_supply;
        vault.rwa_hash = ctx.accounts.rwa_proof.hash;
        vault.bump = ctx.bumps.vault;
        
        msg!("Vault initialized with {} shares", initial_supply);
        msg!("RWA Hash: {:?}", vault.rwa_hash);
        
        Ok(())
    }

    /// Mint shares by depositing RWA proof and transferring tokens
    pub fn mint_shares(ctx: Context<MintShares>, amount: u64) -> Result<()> {
        // Verify oracle proof matches the vault's RWA hash
        require!(
            ctx.accounts.user_oracle_proof.hash == ctx.accounts.vault.rwa_hash,
            ErrorCode::InvalidProof
        );

        // ZK Proof Verification Stub
        // In production, integrate with light-protocol or custom ZK circuit:
        // require!(
        //     verify_zk_proof(&ctx.accounts.zk_proof, &ctx.accounts.vault.rwa_hash),
        //     ErrorCode::InvalidZkProof
        // );
        msg!("ZK proof verification stub - implement with light-protocol for production");

        msg!("Minting {} shares", amount);

        // Transfer user's tokens to vault (mock RWA deposit)
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.vault_token.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Mint vault shares to user
        let vault_key = ctx.accounts.vault.key();
        let seeds = &[
            b"vault".as_ref(),
            vault_key.as_ref(),
            &[ctx.accounts.vault.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts_mint = MintTo {
            mint: ctx.accounts.vault_mint.to_account_info(),
            to: ctx.accounts.user_vault_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program_mint = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_mint = CpiContext::new_with_signer(cpi_program_mint, cpi_accounts_mint, signer);
        token::mint_to(cpi_ctx_mint, amount)?;

        // Update total shares
        ctx.accounts.vault.total_shares = ctx.accounts.vault.total_shares.checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!("Successfully minted {} shares. Total: {}", amount, ctx.accounts.vault.total_shares);

        Ok(())
    }

    /// Burn shares to redeem RWA (stub implementation)
    pub fn burn_shares(ctx: Context<BurnShares>, amount: u64) -> Result<()> {
        msg!("Burning {} shares", amount);

        // Burn user's vault shares
        let cpi_accounts_burn = Burn {
            mint: ctx.accounts.vault_mint.to_account_info(),
            from: ctx.accounts.user_vault_token.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program_burn = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_burn = CpiContext::new(cpi_program_burn, cpi_accounts_burn);
        token::burn(cpi_ctx_burn, amount)?;

        // Update total shares
        ctx.accounts.vault.total_shares = ctx.accounts.vault.total_shares.checked_sub(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!("Successfully burned {} shares. Total: {}", amount, ctx.accounts.vault.total_shares);
        msg!("RWA redemption stub - implement oracle callback here");

        Ok(())
    }
}

// Account Contexts

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub rwa_proof: Account<'info, OracleProof>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintShares<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub vault_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_vault_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub user_oracle_proof: Account<'info, OracleProof>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnShares<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub vault_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user_vault_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

// Account Structures

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,      // 32 bytes
    pub total_shares: u64,      // 8 bytes
    pub rwa_hash: [u8; 32],     // 32 bytes
    pub bump: u8,               // 1 byte
}

#[account]
#[derive(InitSpace)]
pub struct OracleProof {
    pub hash: [u8; 32],         // 32 bytes
    pub timestamp: i64,         // 8 bytes
}

// Error Codes

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid RWA proof - hash mismatch")]
    InvalidProof,
    
    #[msg("Math overflow occurred")]
    MathOverflow,
    
    #[msg("Invalid ZK proof")]
    InvalidZkProof,
}

