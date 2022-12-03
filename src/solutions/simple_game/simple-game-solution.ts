import { CertifiedTransaction, Ed25519Keypair, JsonRpcProvider, Network, RawSigner, SuiCertifiedTransactionEffects, SuiExecuteTransactionResponse, SuiObject, SuiObjectInfo, SuiTransactionResponse } from '@mysten/sui.js';
import { execSync } from 'child_process';

import dotenv from "dotenv";
import { exit } from 'process';

const GAS_BUDGET = 1000000;

// Note: Make sure to update the address of the challenge package and the hero object
const HERO_ADDRESS = '0x4cfe1379d54f2826a4ce38dad41e938fa5f5e682';
const MODULE_ADDRESS = '0x498868ec78fcc3b29e3f769e44f1516e895b03f9';

const packagePath = './hero_solution';

async function main () {

  dotenv.config();

  // connect to local RPC server
  const provider = new JsonRpcProvider();
  const keyPair = Ed25519Keypair.deriveKeypair(process.env.RECOVERY_PHRASE || 'hell0')
  const signer = new RawSigner(keyPair, provider);
  // // Uncomment the following line to use faucet  
  // await provider.requestSuiFromFaucet(
  //   await signer.getAddress()
  // );
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

  const publishTxn = await signer.publishWithRequestType({
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

  // Call function to get treasury box from boar king
  const levelUpTxn = await signer.executeMoveCallWithRequestType({
    packageObjectId: SOLUTION_MODULE_ADDRESS,
    module: 'solution',
    function: 'level_up_hero',
    typeArguments: [],
    arguments: [
      HERO_ADDRESS
    ],
    gasBudget: GAS_BUDGET,
  }) as {
    EffectsCert: {
        certificate: CertifiedTransaction;
        effects: SuiCertifiedTransactionEffects;
    }
  };
  console.log(`Level up transaction:`,  levelUpTxn.EffectsCert.certificate.transactionDigest);

  // Slay the boar king to get the treasury box
  // Call function to get treasury box from boar king
  const slayKingTxn = await signer.executeMoveCallWithRequestType({
    packageObjectId: SOLUTION_MODULE_ADDRESS,
    module: 'solution',
    function: 'slay_king',
    typeArguments: [],
    arguments: [
      HERO_ADDRESS
    ],
    gasBudget: GAS_BUDGET,
  }) as {
    EffectsCert: {
        certificate: CertifiedTransaction;
        effects: SuiCertifiedTransactionEffects;
    }
  };
  console.log(`Slay king transaction:`,  slayKingTxn.EffectsCert.certificate.transactionDigest);

  // Get objects owned by the signer
  let objects = await provider.getObjectsOwnedByAddress(
    await signer.getAddress()
  );

  // Check if the signer has a treasury box
  if (!haveTreasuryBox(objects)) {
    console.log('No treasury box found.');
    console.log(`Try again with a new deployment of the challenge.`);
    console.log(`Exiting...`);
    exit(1);
  }
  console.log('Treasury box found!!')

  // get flag using our custom function that exploits the RNG
  console.log('Getting flag...')
  const flagTxn = await signer.executeMoveCallWithRequestType({
    packageObjectId: SOLUTION_MODULE_ADDRESS,
    module: 'solution',
    function: 'do_get_flag',
    typeArguments: [],
    arguments: [
      getTreasuryBox(objects)
    ],
    gasBudget: GAS_BUDGET,
  }) as {
    EffectsCert: {
        certificate: CertifiedTransaction;
        effects: SuiCertifiedTransactionEffects;
    }
  };
  console.log(`Flag transaction:`, flagTxn.EffectsCert.certificate.transactionDigest);
  
  
  return;
}

// Helper function to check if the signer has a treasury box
const haveTreasuryBox = (objects: SuiObjectInfo[]) => {
  for (const object of objects) {
    if (object.type == `${MODULE_ADDRESS}::inventory::TreasuryBox`) {
      return true;
    }
  }
  return false;
}

// Helper function to get the address of the signer's treasury box
const getTreasuryBox = (objects: SuiObjectInfo[]) => {
  for (const object of objects) {
    if (object.type == `${MODULE_ADDRESS}::inventory::TreasuryBox`) {
      return object.objectId;
    }
  }
  console.log('No treasury box found. Exiting...');
  exit(1);
}

main()