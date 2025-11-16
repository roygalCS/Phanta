import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Program ID - update after deployment
// Using a valid placeholder public key format (44 chars base58)
// This will be replaced with actual program ID after deployment
const PROGRAM_ID_STRING = '11111111111111111111111111111111'; // System program as placeholder
let PROGRAM_ID = null;

try {
  PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
} catch (e) {
  // If invalid, use system program as fallback
  PROGRAM_ID = SystemProgram.programId;
}

export const createGroup = async (publicKey, connection, requiredDepositSol) => {
  try {
    if (!publicKey) {
      throw new Error('Public key is required');
    }
    
    // Derive group PDA
    // Note: This is a placeholder until the actual program is deployed
    // For now, we'll generate a deterministic address based on the owner
    const seed = Buffer.from('group');
    const ownerBuffer = publicKey.toBuffer();
    const combined = Buffer.concat([seed, ownerBuffer]);
    
    // Create a deterministic "group address" (not a real PDA until program is deployed)
    // This will be replaced with actual PDA derivation after program deployment
    const groupPda = publicKey; // Temporary: use owner's key as placeholder

    // For now, return the PDA address - actual on-chain creation will happen after program deployment
    // This is a placeholder until the Solana program is built and deployed
    return {
      success: true,
      groupAddress: groupPda.toString(),
      signature: 'placeholder', // Will be replaced with actual transaction signature
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const joinGroup = async (publicKey, connection, groupAddress, depositSol) => {
  try {
    const deposit = new BN(depositSol * LAMPORTS_PER_SOL);
    const groupPubkey = new PublicKey(groupAddress);

    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: groupPubkey,
        lamports: deposit.toNumber(),
      })
    );

    // Sign and send via Phantom
    if (!window.solana) {
      throw new Error('Phantom wallet not found');
    }

    const { signature } = await window.solana.signAndSendTransaction({
      transaction,
      connection,
    });

    await connection.confirmTransaction(signature);

    return {
      success: true,
      signature,
    };
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

export const getGroupData = async (connection, groupAddress) => {
  try {
    const groupPubkey = new PublicKey(groupAddress);
    const accountInfo = await connection.getAccountInfo(groupPubkey);
    
    if (!accountInfo) {
      return null;
    }

    // Parse account data (simplified - will use IDL parser after build)
    // For now, return basic structure
    return {
      address: groupAddress,
      exists: true,
      // Actual parsing will happen after IDL is available
    };
  } catch (error) {
    console.error('Error fetching group data:', error);
    return null;
  }
};

