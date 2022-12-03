// Sui library for interacting with the Sui blockchain
import { Ed25519Keypair, JsonRpcProvider, RawSigner } from '@mysten/sui.js';
// Env
import dotenv from "dotenv";

const MODULE_ADDRESS = '0x63c60c8369a296d1ff1d2e7f347334f67019f306'

async function main () {

  // Get dev account mnemonic phrase from env
  dotenv.config();

  // connect to local RPC server
  const provider = new JsonRpcProvider();
  // Create a signer from the private key
  const keyPair = Ed25519Keypair.deriveKeypair(process.env.RECOVERY_PHRASE || 'hell0')
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
  const moveCallTxn = await signer.executeMoveCallWithRequestType({
    packageObjectId: MODULE_ADDRESS,
    module: 'checkin',
    function: 'get_flag',
    typeArguments: [],
    arguments: [],
    gasBudget: 10000,
  });

  // Print the result of the function call
  console.log('moveCallTxn', JSON.stringify(moveCallTxn, null, 2));
  
  return;
}

main()