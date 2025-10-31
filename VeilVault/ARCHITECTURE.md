# 🏗️ VeilVault Architecture

## Overview

VeilVault is a full-stack decentralized application built on Solana that enables privacy-preserving tokenization of Real World Assets (RWAs). The architecture consists of three main layers: Smart Contract Layer, Frontend Layer, and Integration Layer.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Next.js App │  │ Wallet       │  │  Metrics     │      │
│  │  (React)     │  │ Adapter      │  │  Dashboard   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Integration Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Anchor       │  │ SPL Token    │  │  ZK Proof    │      │
│  │ Provider     │  │ Program      │  │  Utils       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Smart Contract Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              VeilVault Program (Anchor)              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │ Initialize │  │    Mint    │  │    Burn    │    │   │
│  │  │   Vault    │  │   Shares   │  │   Shares   │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Vault PDA    │  │ Oracle Proof │                         │
│  │ Account      │  │ Account      │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Solana Blockchain                       │
│                         (Devnet)                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Smart Contract Layer (Anchor/Rust)

#### Program Structure
```rust
veilvault/
├── lib.rs              # Main program logic
├── instructions/       # Instruction handlers
│   ├── initialize.rs
│   ├── mint.rs
│   └── burn.rs
├── state/             # Account structures
│   ├── vault.rs
│   └── oracle_proof.rs
└── errors.rs          # Custom error codes
```

#### Account Types

**Vault Account**
```rust
pub struct Vault {
    pub authority: Pubkey,      // Vault owner (32 bytes)
    pub total_shares: u64,      // Total minted shares (8 bytes)
    pub rwa_hash: [u8; 32],     // RWA proof hash (32 bytes)
    pub bump: u8,               // PDA bump seed (1 byte)
}
// Total: 73 bytes + 8 byte discriminator = 81 bytes
```

**Oracle Proof Account**
```rust
pub struct OracleProof {
    pub hash: [u8; 32],         // RWA hash (32 bytes)
    pub timestamp: i64,         // Proof timestamp (8 bytes)
}
// Total: 40 bytes + 8 byte discriminator = 48 bytes
```

#### Instructions

**1. Initialize Vault**
- Creates a new vault PDA
- Stores RWA hash and initial supply
- Sets vault authority to caller
- Derives PDA from seeds: `["vault", user_pubkey]`

**2. Mint Shares**
- Verifies oracle proof matches vault RWA hash
- Transfers user tokens to vault (mock RWA deposit)
- Mints vault shares to user as SPL tokens
- Updates total shares counter
- Includes ZK proof verification stub

**3. Burn Shares**
- Burns user's vault shares
- Updates total shares counter
- Stub for RWA redemption (oracle callback)

#### PDA Derivation
```rust
// Vault PDA
seeds = [b"vault", user.key().as_ref()]
bump = vault.bump

// Ensures deterministic vault addresses per user
```

#### Security Features
- PDA-based access control
- Checked arithmetic (overflow protection)
- Oracle proof verification
- SPL token CPI security
- Comprehensive error handling

---

### 2. Frontend Layer (Next.js/TypeScript)

#### Application Structure
```
app/
├── app/
│   ├── page.tsx           # Home page (vault operations)
│   ├── metrics/
│   │   └── page.tsx       # Metrics dashboard
│   ├── layout.tsx         # Root layout with providers
│   └── globals.css        # Global styles
├── components/
│   └── WalletContextProvider.tsx  # Wallet adapter setup
├── utils/
│   └── zkProof.ts         # ZK proof utilities
├── idl/
│   └── veilvault.json     # Program IDL
└── public/                # Static assets
```

#### Key Components

**WalletContextProvider**
- Wraps app with Solana wallet adapter
- Configures supported wallets (Phantom, Solflare)
- Manages connection to devnet
- Provides wallet context to all components

**Home Page (page.tsx)**
- Wallet connection UI
- Vault initialization form
- Mint/burn share operations
- Real-time vault info display
- Transaction status notifications

**Metrics Page (metrics/page.tsx)**
- Protocol statistics (transactions, costs, vaults)
- Interactive charts (Recharts)
- Time-series transaction data
- Real-time data fetching from RPC

#### State Management
- React hooks (useState, useEffect, useMemo)
- Wallet adapter hooks (useWallet, useConnection)
- Anchor Provider for program interaction
- Local state for UI (loading, errors, forms)

#### Data Flow
```
User Action → Wallet Sign → Anchor Provider → Program Instruction → 
Solana RPC → Transaction → Confirmation → UI Update
```

---

### 3. Integration Layer

#### Anchor Provider
```typescript
const provider = new AnchorProvider(
  connection,           // Solana RPC connection
  wallet,              // Wallet adapter
  { commitment: 'confirmed' }
);

const program = new Program(idl, PROGRAM_ID, provider);
```

#### SPL Token Integration
- Uses `@solana/spl-token` for token operations
- Vault shares minted as standard SPL tokens
- Compatible with all Solana wallets and DEXs
- Supports associated token accounts

#### ZK Proof System (Stub)
```typescript
// Mock ZK proof generation
export async function generateMockZKProof(rwaHash: string): Promise<ZKProof> {
  // In production: integrate Light Protocol or custom circuit
  return {
    proof: Uint8Array,
    publicInputs: [hash],
    timestamp: Date.now()
  };
}
```

**Production Integration Path:**
1. Implement Groth16/PLONK circuit for RWA verification
2. Integrate Light Protocol for ZK compression
3. Add on-chain proof verification
4. Update smart contract with real verification logic

---

## Data Flow Diagrams

### Vault Initialization Flow
```
User                Frontend              Anchor Program         Solana
  │                    │                        │                  │
  │  Connect Wallet    │                        │                  │
  ├───────────────────>│                        │                  │
  │                    │                        │                  │
  │  Init Vault (1000) │                        │                  │
  ├───────────────────>│                        │                  │
  │                    │  Create Oracle Proof   │                  │
  │                    ├───────────────────────>│                  │
  │                    │                        │  Create Account  │
  │                    │                        ├─────────────────>│
  │                    │                        │                  │
  │                    │  Initialize Vault IX   │                  │
  │                    ├───────────────────────>│                  │
  │                    │                        │  Create Vault PDA│
  │                    │                        ├─────────────────>│
  │                    │                        │                  │
  │                    │  Transaction Signature │                  │
  │                    │<───────────────────────┤                  │
  │  Success Toast     │                        │                  │
  │<───────────────────┤                        │                  │
  │                    │                        │                  │
```

### Mint Shares Flow
```
User                Frontend              Anchor Program         SPL Token
  │                    │                        │                  │
  │  Mint 100 Shares   │                        │                  │
  ├───────────────────>│                        │                  │
  │                    │  Generate ZK Proof     │                  │
  │                    │  (mock)                │                  │
  │                    │                        │                  │
  │                    │  Mint Shares IX        │                  │
  │                    ├───────────────────────>│                  │
  │                    │                        │  Verify Proof    │
  │                    │                        │  (stub)          │
  │                    │                        │                  │
  │                    │                        │  Transfer Tokens │
  │                    │                        ├─────────────────>│
  │                    │                        │                  │
  │                    │                        │  Mint Shares     │
  │                    │                        ├─────────────────>│
  │                    │                        │                  │
  │                    │  Success               │                  │
  │                    │<───────────────────────┤                  │
  │  Shares Minted     │                        │                  │
  │<───────────────────┤                        │                  │
```

---

## Security Architecture

### Smart Contract Security
1. **Access Control**: PDA-based ownership verification
2. **Arithmetic Safety**: Checked operations prevent overflow
3. **Input Validation**: All inputs validated before processing
4. **CPI Security**: Proper signer seeds for cross-program invocations
5. **Error Handling**: Comprehensive error codes and messages

### Frontend Security
1. **Wallet Verification**: All transactions require wallet signature
2. **Input Sanitization**: User inputs validated before submission
3. **RPC Security**: Uses official Solana RPC endpoints
4. **Environment Variables**: Sensitive data in .env files
5. **HTTPS**: All production deployments use HTTPS

### Future Security Enhancements
- [ ] Multi-signature vault authority
- [ ] Time-locked operations
- [ ] Rate limiting on minting
- [ ] Emergency pause mechanism
- [ ] Security audit by third party

---

## Performance Considerations

### Smart Contract
- **Transaction Size**: ~300 bytes per instruction
- **Compute Units**: ~10,000 CU per instruction
- **Account Size**: Vault (81 bytes), Oracle (48 bytes)
- **PDA Derivation**: O(1) lookup time

### Frontend
- **Initial Load**: <2s (Next.js SSR)
- **Wallet Connection**: ~500ms
- **Transaction Confirmation**: ~400ms (devnet)
- **Chart Rendering**: <100ms (Recharts)

### Scalability
- **Vaults per User**: Unlimited (unique PDAs)
- **Shares per Vault**: Up to u64::MAX (~18 quintillion)
- **Concurrent Users**: Limited by Solana TPS (~65,000)
- **Storage**: Minimal on-chain footprint

---

## Technology Stack

### Backend
- **Blockchain**: Solana (Devnet)
- **Framework**: Anchor 0.29.0
- **Language**: Rust 1.70+
- **Token Standard**: SPL Token

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts 2
- **Wallet**: Solana Wallet Adapter

### DevOps
- **Deployment**: Vercel (frontend), Solana CLI (program)
- **Version Control**: Git/GitHub
- **CI/CD**: GitHub Actions (future)
- **Monitoring**: Solana Explorer, RPC logs

---

## Future Architecture Enhancements

### Phase 2: Production ZK Proofs
- Integrate Light Protocol for ZK compression
- Implement Groth16 circuits for RWA verification
- Add on-chain proof verification
- Support multiple proof systems

### Phase 3: Oracle Integration
- Chainlink integration for RWA price feeds
- Pyth Network for real-time asset valuation
- Custom oracle for asset verification
- Multi-oracle consensus mechanism

### Phase 4: Advanced Features
- Vault marketplace for secondary trading
- Automated market maker for vault shares
- Lending protocol integration
- Cross-chain bridges (Wormhole)

### Phase 5: Mainnet Deployment
- Security audit by Certik/Quantstamp
- Mainnet program deployment
- Production frontend with CDN
- Monitoring and alerting system

---

## Development Workflow

```
1. Local Development
   ├── anchor build
   ├── anchor test
   └── cd app && yarn dev

2. Testing
   ├── Unit tests (Rust)
   ├── Integration tests (TypeScript)
   └── E2E tests (Playwright)

3. Deployment
   ├── anchor deploy --provider.cluster devnet
   ├── Update program IDs
   └── vercel --prod

4. Monitoring
   ├── Solana Explorer
   ├── RPC logs
   └── Frontend analytics
```

---

**Architecture designed for scalability, security, and user experience.**

