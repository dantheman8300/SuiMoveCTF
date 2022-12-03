import { CertifiedTransaction, Ed25519Keypair, JsonRpcProvider, RawSigner, SuiCertifiedTransactionEffects, SuiTransactionResponse } from '@mysten/sui.js';
import { execSync } from 'child_process';
import dotenv from "dotenv";
import { exit } from 'process';

// Note: Make sure to update the address of the challenge package and the hero object
const FLASHLENDER_ADDRESS = '' 

const GAS_BUDGET = 1000000;

const packagePath = './solutions/flash_loan/flash_loan_solution';

async function main () {

  dotenv.config();
  if (process.env.RECOVERY_PHRASE == undefined) {
    console.error('RECOVERY_PHRASE not set');
    exit(1);
  }

  // connect to local RPC server
  const provider = new JsonRpcProvider();
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

  console.log(`Signer address: ${await signer.getAddress()}`)

  // Compile and deploy the solution module
  // Note: Make sure to update the addresses of the challenge package before deploying
  const compiledModules: Array<string> = JSON.parse(
    execSync(
      `sui move build --dump-bytecode-as-base64 --path ${packagePath}`,
      { encoding: 'utf-8'}
    )
  );

  // Publish the package
  const publishTxn = await signer.publish({
    compiledModules: compiledModules,
    gasBudget: GAS_BUDGET,
  }) as {
    EffectsCert: {
        certificate: CertifiedTransaction;
        effects: SuiCertifiedTransactionEffects;
    }
  };

  // Get address of publish module
  const events = await provider.getTransactionWithEffects(
    publishTxn.EffectsCert.certificate.transactionDigest
  ) as SuiTransactionResponse;
  const createdModules = events.effects.created;
  if (createdModules == undefined || createdModules.length != 1) {
    console.error('Unexpected number of modules created');
    exit(1);
  }
  const SOLUTION_MODULE_ADDRESS = createdModules[0].reference.objectId;
  console.log(`Solution module address: ${SOLUTION_MODULE_ADDRESS}`);

  // Call the get flag function in our solution module
  console.log(`Calling getFlag() in solution module...`);
  const getFlagTxn = await signer.executeMoveCall({
    packageObjectId: SOLUTION_MODULE_ADDRESS,
    module: 'solution',
    function: 'getFlag',
    typeArguments: [],
    arguments: [
      FLASHLENDER_ADDRESS
    ],
    gasBudget: GAS_BUDGET,
  }) as {
    EffectsCert: {
        certificate: CertifiedTransaction;
        effects: SuiCertifiedTransactionEffects;
    }
  };
  console.log('getFlag() txn digest:', getFlagTxn.EffectsCert.certificate.transactionDigest);
  
  return;
}

main()