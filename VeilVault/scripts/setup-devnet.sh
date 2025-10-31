#!/bin/bash

# Setup script for Solana devnet development

set -e

echo "🔧 VeilVault Devnet Setup"
echo "========================="

# Set Solana to devnet
echo "Setting Solana cluster to devnet..."
solana config set --url devnet

# Check if wallet exists
if [ ! -f ~/.config/solana/id.json ]; then
    echo "Creating new Solana wallet..."
    solana-keygen new --outfile ~/.config/solana/id.json
else
    echo "Using existing wallet: $(solana address)"
fi

# Airdrop SOL
echo ""
echo "Requesting airdrop..."
solana airdrop 2 || echo "⚠️  Airdrop failed. You may need to wait or use a faucet."

# Show balance
echo ""
echo "Current balance: $(solana balance)"

echo ""
echo "✅ Devnet setup complete!"
echo ""
echo "Wallet address: $(solana address)"
echo "Cluster: $(solana config get | grep 'RPC URL' | awk '{print $3}')"
echo ""

