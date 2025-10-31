import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Veilvault } from "../target/types/veilvault";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount, 
  mintTo,
  getAccount
} from "@solana/spl-token";
import { assert } from "chai";

describe("veilvault", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Veilvault as Program<Veilvault>;
  const payer = provider.wallet as anchor.Wallet;

  let vaultPda: PublicKey;
  let vaultBump: number;
  let oracleProofKeypair: Keypair;
  let userTokenMint: PublicKey;
  let vaultSharesMint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultTokenAccount: PublicKey;
  let userVaultTokenAccount: PublicKey;

  const rwaHash = Array(32).fill(0).map((_, i) => i % 256); // Mock hash

  before(async () => {
    // Derive vault PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), payer.publicKey.toBuffer()],
      program.programId
    );

    // Create oracle proof account
    oracleProofKeypair = Keypair.generate();
    
    // Create user token mint (represents RWA tokens)
    userTokenMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      9
    );

    // Create vault shares mint
    vaultSharesMint = await createMint(
      provider.connection,
      payer.payer,
      vaultPda, // Vault is the mint authority
      null,
      9
    );

    // Create token accounts
    userTokenAccount = await createAccount(
      provider.connection,
      payer.payer,
      userTokenMint,
      payer.publicKey
    );

    vaultTokenAccount = await createAccount(
      provider.connection,
      payer.payer,
      userTokenMint,
      vaultPda
    );

    userVaultTokenAccount = await createAccount(
      provider.connection,
      payer.payer,
      vaultSharesMint,
      payer.publicKey
    );

    // Mint some tokens to user
    await mintTo(
      provider.connection,
      payer.payer,
      userTokenMint,
      userTokenAccount,
      payer.publicKey,
      1000000000 // 1000 tokens with 9 decimals
    );

    console.log("Setup complete:");
    console.log("  Vault PDA:", vaultPda.toString());
    console.log("  User Token Mint:", userTokenMint.toString());
    console.log("  Vault Shares Mint:", vaultSharesMint.toString());
  });

  it("Initializes vault with RWA proof", async () => {
    const initialSupply = new anchor.BN(1000);

    // Create oracle proof account
    await program.methods
      .initializeVault(initialSupply)
      .accounts({
        vault: vaultPda,
        user: payer.publicKey,
        rwaProof: oracleProofKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([oracleProofKeypair])
      .preInstructions([
        await program.account.oracleProof.createInstruction(oracleProofKeypair, 8 + 32 + 8)
      ])
      .rpc();

    // Initialize oracle proof data
    await program.methods
      .initializeVault(initialSupply)
      .accounts({
        vault: vaultPda,
        user: payer.publicKey,
        rwaProof: oracleProofKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .preInstructions([
        // Set oracle proof data manually for testing
        await program.account.oracleProof.createInstruction(oracleProofKeypair)
      ])
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    
    assert.equal(vaultAccount.authority.toString(), payer.publicKey.toString());
    assert.equal(vaultAccount.totalShares.toNumber(), initialSupply.toNumber());
    
    console.log("✓ Vault initialized successfully");
    console.log("  Authority:", vaultAccount.authority.toString());
    console.log("  Total Shares:", vaultAccount.totalShares.toString());
  });

  it("Mints shares with valid oracle proof", async () => {
    const mintAmount = new anchor.BN(100000000); // 100 tokens

    const userTokenBefore = await getAccount(provider.connection, userTokenAccount);
    const userVaultTokenBefore = await getAccount(provider.connection, userVaultTokenAccount);

    await program.methods
      .mintShares(mintAmount)
      .accounts({
        vault: vaultPda,
        vaultMint: vaultSharesMint,
        userToken: userTokenAccount,
        vaultToken: vaultTokenAccount,
        userVaultToken: userVaultTokenAccount,
        user: payer.publicKey,
        userOracleProof: oracleProofKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const userTokenAfter = await getAccount(provider.connection, userTokenAccount);
    const userVaultTokenAfter = await getAccount(provider.connection, userVaultTokenAccount);
    const vaultAccount = await program.account.vault.fetch(vaultPda);

    // Verify tokens were transferred
    assert.equal(
      Number(userTokenBefore.amount) - Number(userTokenAfter.amount),
      mintAmount.toNumber(),
      "User tokens should decrease"
    );

    // Verify vault shares were minted
    assert.equal(
      Number(userVaultTokenAfter.amount) - Number(userVaultTokenBefore.amount),
      mintAmount.toNumber(),
      "User vault shares should increase"
    );

    console.log("✓ Shares minted successfully");
    console.log("  Amount:", mintAmount.toString());
    console.log("  New Total Shares:", vaultAccount.totalShares.toString());
  });

  it("Burns shares to redeem RWA", async () => {
    const burnAmount = new anchor.BN(50000000); // 50 tokens

    const userVaultTokenBefore = await getAccount(provider.connection, userVaultTokenAccount);
    const vaultBefore = await program.account.vault.fetch(vaultPda);

    await program.methods
      .burnShares(burnAmount)
      .accounts({
        vault: vaultPda,
        vaultMint: vaultSharesMint,
        userVaultToken: userVaultTokenAccount,
        user: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const userVaultTokenAfter = await getAccount(provider.connection, userVaultTokenAccount);
    const vaultAfter = await program.account.vault.fetch(vaultPda);

    // Verify vault shares were burned
    assert.equal(
      Number(userVaultTokenBefore.amount) - Number(userVaultTokenAfter.amount),
      burnAmount.toNumber(),
      "User vault shares should decrease"
    );

    // Verify total shares decreased
    assert.equal(
      vaultBefore.totalShares.toNumber() - vaultAfter.totalShares.toNumber(),
      burnAmount.toNumber(),
      "Total shares should decrease"
    );

    console.log("✓ Shares burned successfully");
    console.log("  Amount:", burnAmount.toString());
    console.log("  New Total Shares:", vaultAfter.totalShares.toString());
  });
});

