#!/bin/bash

# VeilVault Deployment Script
# Deploys the Anchor program to Solana devnet

set -e

echo "🚀 VeilVault Deployment Script"
echo "================================"

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install Anchor:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "   avm install latest"
    echo "   avm use latest"
    exit 1
fi

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install Solana:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

echo ""
echo "📋 Pre-deployment checks..."

# Check Solana config
echo "Current cluster: $(solana config get | grep 'RPC URL' | awk '{print $3}')"
echo "Current wallet: $(solana config get | grep 'Keypair Path' | awk '{print $3}')"

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "⚠️  Low balance! You need at least 2 SOL for deployment."
    echo "   Get devnet SOL: solana airdrop 2"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔨 Building program..."
anchor build

echo ""
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the program ID from above"
echo "2. Update Anchor.toml with the new program ID"
echo "3. Update app/idl/veilvault.json with the new program ID"
echo "4. Update app/.env.local with NEXT_PUBLIC_PROGRAM_ID"
echo "5. Rebuild: anchor build"
echo "6. Run tests: anchor test"
echo ""

