"use client";

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { useState, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import idl from '../idl/veilvault.json';
import Link from 'next/link';

const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction, signAllTransactions } = wallet;

  const [amount, setAmount] = useState<number>(100);
  const [rwaHash, setRwaHash] = useState<string>('mock_hash_123');
  const [loading, setLoading] = useState<boolean>(false);
  const [vaultInfo, setVaultInfo] = useState<any>(null);

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions } as any,
      { commitment: 'confirmed' }
    );
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as any, PROGRAM_ID, provider);
  }, [provider]);

  const getVaultPda = () => {
    if (!publicKey) return null;
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), publicKey.toBuffer()],
      PROGRAM_ID
    );
    return vaultPda;
  };

  const handleInitialize = async () => {
    if (!publicKey || !program) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const vaultPda = getVaultPda();
      if (!vaultPda) throw new Error('Failed to derive vault PDA');

      // Create a mock oracle proof account
      const oracleProofKeypair = Keypair.generate();
      
      // Create the oracle proof account first
      const createOracleProofIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: oracleProofKeypair.publicKey,
        space: 8 + 32 + 8, // discriminator + hash + timestamp
        lamports: await connection.getMinimumBalanceForRentExemption(8 + 32 + 8),
        programId: PROGRAM_ID,
      });

      const tx = await program.methods
        .initializeVault(new BN(1000))
        .accounts({
          vault: vaultPda,
          user: publicKey,
          rwaProof: oracleProofKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([createOracleProofIx])
        .signers([oracleProofKeypair])
        .rpc();

      toast.success(`Vault initialized! Tx: ${tx.slice(0, 8)}...`);
      
      // Fetch vault info
      const vault = await program.account.vault.fetch(vaultPda);
      setVaultInfo(vault);
      
      console.log('Vault initialized:', vault);
    } catch (error: any) {
      console.error('Error initializing vault:', error);
      toast.error(`Error: ${error.message || 'Failed to initialize vault'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!publicKey || !program) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const vaultPda = getVaultPda();
      if (!vaultPda) throw new Error('Failed to derive vault PDA');

      toast.info('Minting shares... (This is a demo with mock tokens)');
      
      // In a real implementation, you would:
      // 1. Create/get user token accounts
      // 2. Create/get vault token accounts
      // 3. Call mint_shares with proper accounts
      
      // For demo purposes, we'll show the structure
      toast.success(`Mint operation prepared for ${amount} shares`);
      
      console.log('Mint parameters:', {
        vault: vaultPda.toString(),
        amount,
        rwaHash,
      });
    } catch (error: any) {
      console.error('Error minting shares:', error);
      toast.error(`Error: ${error.message || 'Failed to mint shares'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!publicKey || !program) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const vaultPda = getVaultPda();
      if (!vaultPda) throw new Error('Failed to derive vault PDA');

      toast.info('Burning shares...');
      
      // In a real implementation, you would:
      // 1. Get user vault token account
      // 2. Call burn_shares with proper accounts
      
      // For demo purposes
      toast.success(`Burn operation prepared for ${amount} shares`);
      
      console.log('Burn parameters:', {
        vault: vaultPda.toString(),
        amount,
      });
    } catch (error: any) {
      console.error('Error burning shares:', error);
      toast.error(`Error: ${error.message || 'Failed to burn shares'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchVaultInfo = async () => {
    if (!publicKey || !program) return;
    
    try {
      const vaultPda = getVaultPda();
      if (!vaultPda) return;
      
      const vault = await program.account.vault.fetch(vaultPda);
      setVaultInfo(vault);
    } catch (error) {
      console.log('Vault not initialized yet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b border-purple-500/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                VeilVault
              </h1>
              <p className="text-gray-400 text-sm mt-1">Anonymous RWA Vaults on Solana</p>
            </div>
            <div className="flex gap-4 items-center">
              <Link 
                href="/metrics" 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
              >
                Metrics
              </Link>
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {!publicKey ? (
          <div className="text-center py-20">
            <div className="mb-8">
              <svg className="w-24 h-24 mx-auto text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your Solana wallet to start using VeilVault</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Vault Info Card */}
            {vaultInfo && (
              <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Your Vault</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Shares</p>
                    <p className="text-2xl font-bold">{vaultInfo.totalShares?.toString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Authority</p>
                    <p className="text-sm font-mono">{vaultInfo.authority?.toString().slice(0, 8)}...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Operations Card */}
            <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Vault Operations</h2>
              
              <div className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition"
                    placeholder="Enter amount"
                  />
                </div>

                {/* RWA Hash Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">RWA Hash (Mock)</label>
                  <input
                    type="text"
                    value={rwaHash}
                    onChange={(e) => setRwaHash(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 transition font-mono text-sm"
                    placeholder="Enter RWA hash"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <button
                    onClick={handleInitialize}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Initialize'}
                  </button>
                  
                  <button
                    onClick={handleMint}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Mint Shares'}
                  </button>
                  
                  <button
                    onClick={handleBurn}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Burn Shares'}
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={fetchVaultInfo}
                  className="w-full px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg transition text-sm"
                >
                  Refresh Vault Info
                </button>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Demo Mode
              </h3>
              <p className="text-sm text-gray-300">
                This is a demo interface. Full token operations require deployed program on devnet and proper token account setup.
                The Initialize function demonstrates the vault creation flow.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

