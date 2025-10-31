# 🔐 VeilVault

**Anonymous RWA Vaults on Solana with Zero-Knowledge Proofs**

VeilVault is a decentralized protocol for tokenizing Real World Assets (RWAs) into anonymous vaults using zero-knowledge proofs on Solana. Users can deposit RWA proofs, mint/burn vault shares as SPL tokens, and maintain privacy through ZK cryptography.

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)
![Anchor](https://img.shields.io/badge/Anchor-0.29.0-663399)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## 🌟 Features

- **🏦 RWA Tokenization**: Convert real-world assets (art, deeds, collectibles) into on-chain vault shares
- **🔒 Anonymous Vaults**: Privacy-preserving vault creation with ZK proof stubs
- **💎 SPL Token Shares**: Mint and burn fungible vault shares as SPL tokens
- **📊 Real-time Metrics**: Track protocol activity, transaction costs, and vault statistics
- **🎨 Modern UI**: Beautiful, responsive Next.js interface with Solana wallet integration
- **⚡ Solana Speed**: Fast, low-cost transactions on Solana devnet

## 🏗️ Architecture

### Smart Contract (Anchor/Rust)
- **Vault Account**: Stores authority, total shares, RWA hash, and PDA bump
- **Oracle Proof Account**: Contains RWA hash and timestamp for verification
- **Instructions**:
  - `initialize_vault`: Create a new vault with initial supply
  - `mint_shares`: Deposit RWA proof and mint vault shares
  - `burn_shares`: Burn shares to redeem RWA (stub implementation)

### Frontend (Next.js)
- **Home Page**: Wallet connection, vault operations (Init/Mint/Burn)
- **Metrics Page**: Protocol analytics with interactive charts
- **Wallet Integration**: Phantom, Solflare support via Solana Wallet Adapter
- **ZK Proof Utils**: Mock ZK proof generation for demonstration

## 📚 Documentation


- **[Architecture](ARCHITECTURE.md)** - System design and technical details
- **[Project Summary](PROJECT_SUMMARY.md)** - Complete MVP overview

## 🚀 Quick Start

> **New to VeilVault?** Check out the [Quick Start Guide](QUICKSTART.md) for a 5-minute setup!

### Prerequisites

- Node.js 18+ and Yarn/npm
- Rust 1.70+
- Solana CLI 1.16+
- Anchor CLI 0.29.0

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/veilvault.git
cd veilvault

# Install dependencies
yarn install
cd app && yarn install && cd ..

# Setup Solana devnet
chmod +x scripts/setup-devnet.sh
./scripts/setup-devnet.sh
```

### Build & Test

```bash
# Build the Anchor program
anchor build

# Run tests
anchor test

# Start local validator (optional)
solana-test-validator
```

### Deploy to Devnet

```bash
# Deploy the program
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Update program ID in:
# - Anchor.toml
# - app/idl/veilvault.json
# - app/.env.local

# Rebuild after updating IDs
anchor build
```

### Run Frontend

```bash
cd app

# Install dependencies
yarn install

# Start development server
yarn dev

# Open http://localhost:3000
```

## 📱 Usage

### 1. Connect Wallet
- Click "Select Wallet" and choose Phantom or Solflare
- Ensure you're on Solana devnet
- Get devnet SOL: `solana airdrop 2`

### 2. Initialize Vault
- Enter initial supply (e.g., 1000)
- Provide RWA hash (mock: "mock_hash_123")
- Click "Initialize" to create your vault

### 3. Mint Shares
- Enter amount of shares to mint
- Ensure RWA hash matches vault
- Click "Mint Shares" (requires token accounts)

### 4. Burn Shares
- Enter amount of shares to burn
- Click "Burn Shares" to redeem RWA

### 5. View Metrics
- Navigate to `/metrics` page
- See transaction counts, costs, and charts
- Refresh to update data

## 🎯 Demo Flow

1. **Setup**: Connect wallet on devnet
2. **Create Vault**: Initialize with 1000 shares and mock RWA hash
3. **View Vault**: See vault info displayed on dashboard
4. **Check Metrics**: Navigate to metrics page for analytics
5. **Explore**: Test mint/burn operations (requires full token setup)

## 📊 Project Structure

```
veilvault/
├── programs/
│   └── veilvault/
│       ├── src/
│       │   └── lib.rs          # Smart contract logic
│       └── Cargo.toml
├── app/
│   ├── app/
│   │   ├── page.tsx            # Home page
│   │   ├── metrics/
│   │   │   └── page.tsx        # Metrics page
│   │   └── layout.tsx
│   ├── components/
│   │   └── WalletContextProvider.tsx
│   ├── utils/
│   │   └── zkProof.ts          # ZK proof utilities
│   ├── idl/
│   │   └── veilvault.json      # Program IDL
│   └── package.json
├── tests/
│   └── veilvault.ts            # Anchor tests
├── scripts/
│   ├── deploy.sh               # Deployment script
│   └── setup-devnet.sh         # Devnet setup
├── Anchor.toml
├── Cargo.toml
└── README.md
```

## 🔧 Configuration

### Environment Variables (app/.env.local)

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

### Anchor Configuration (Anchor.toml)

```toml
[programs.devnet]
veilvault = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

## 🧪 Testing

```bash
# Run all tests
anchor test

# Run specific test
anchor test -- --test initialize_vault

# Run with logs
anchor test -- --nocapture
```

## 🚢 Deployment

### Solana Program (Devnet)

```bash
# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Verify
solana program show <PROGRAM_ID>
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub repo to Vercel dashboard
```

## 🔐 Security Considerations

⚠️ **This is a demo/MVP implementation. For production:**

1. **ZK Proofs**: Integrate real ZK circuits (Light Protocol, Groth16)
2. **Oracle Integration**: Connect to real RWA oracles (Chainlink, Pyth)
3. **Audit**: Get smart contract security audit
4. **Access Control**: Implement proper role-based permissions
5. **Testing**: Add comprehensive integration and fuzzing tests
6. **Mainnet**: Thorough testing before mainnet deployment

## 🛣️ Roadmap

- [ ] Integrate Light Protocol for real ZK proofs
- [ ] Add Chainlink oracle for RWA verification
- [ ] Implement multi-signature vault authority
- [ ] Add vault marketplace for trading shares
- [ ] Support multiple RWA types (NFTs, tokens, etc.)
- [ ] Mobile app with React Native
- [ ] Mainnet deployment

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Solana](https://solana.com/) - High-performance blockchain
- [Anchor](https://www.anchor-lang.com/) - Solana development framework
- [Light Protocol](https://www.lightprotocol.com/) - ZK compression on Solana
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter) - Wallet integration
- [Recharts](https://recharts.org/) - Data visualization

## 📞 Contact

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Twitter**: [@yourhandle](https://twitter.com/yourhandle)
- **Discord**: Join our [community](https://discord.gg/veilvault)

## 🏆 Colosseum Submission

This project is submitted to Colosseum hackathon:
- **Track**: DeFi / Infrastructure
- **Demo**: [Live Demo](https://veilvault.vercel.app)
- **Video**: [Demo Video](https://youtu.be/demo)

---

**Built with ❤️ on Solana**

