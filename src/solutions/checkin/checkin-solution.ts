// Sui library for interacting with the Sui blockchain
import { CertifiedTransaction, Ed25519Keypair, JsonRpcProvider, RawSigner, SuiCertifiedTransactionEffects } from '@mysten/sui.js';
// Env
import dotenv from "dotenv";
import { exit } from 'process';

// Note: Make sure to update the address of the challenge package and the hero object
const MODULE_ADDRESS = ''

const GAS_BUDGET = 1000000;


async function main () {

  // Get dev account mnemonic phrase from env
  dotenv.config();
  if (process.env.RECOVERY_PHRASE == undefined) {
    console.error('RECOVERY_PHRASE not set');
    exit(1);
  }

  // connect to local RPC server
  const provider = new JsonRpcProvider();
  // Create a signer from the private key
  const keyPair = Ed25519Keypair.deriveKeypair(process.env.RECOVERY_PHRASE)
  const signer = new RawSigner(keyPair, provider);

  // Fund the account if needed
  const balance = await provider.getCoinBalancesOwnedByAddress(
    await signer.getAddress()
  );
  if (balance.length === 0) {
    console.log('Funding account...');
    await provider.requestSuiFromFaucet(await signer.getAddress());
  }

  // Print the dev account address
  console.log(`Signer address: ${await signer.getAddress()}`)

  // Called the get_flag method on the module
  const checkinTxn = await signer.executeMoveCall({
    packageObjectId: MODULE_ADDRESS,
    module: 'checkin',
    function: 'get_flag',
    typeArguments: [],
    arguments: [],
    gasBudget: GAS_BUDGET,
  }) as {
    EffectsCert: {
        certificate: CertifiedTransaction;
        effects: SuiCertifiedTransactionEffects;
    }
  };

  // Print the result of the function call
  console.log('Checkin txn digest:', checkinTxn.EffectsCert.certificate.transactionDigest);
  
  return;
}

main()