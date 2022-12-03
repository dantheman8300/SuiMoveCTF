import { Ed25519Keypair, JsonRpcProvider, Network, RawSigner, SuiObject, SuiObjectInfo } from '@mysten/sui.js';

import dotenv from "dotenv";
import { exit } from 'process';

const LENDER_ADDRESS = '0x2fd6808e216f5bfb394a4e0900eb81ed312207e7'
const MODULE_ADDRESS = '0x72a17e9d471cf4cc9fe4e0df3d9c68287a86a9d6'
const FLASH_COIN = '0x2e7edc9e49d56a6ee191a6e87c7bd06979837cd9'


async function main () {

  dotenv.config();

  // connect to local RPC server
  const provider = new JsonRpcProvider();

  const keyPair = Ed25519Keypair.deriveKeypair(process.env.RECOVERY_PHRASE || 'hell0')

  const signer = new RawSigner(keyPair, provider);

  console.log(`Signer address: ${await signer.getAddress()}`)

  const moveCallTxn = await signer.executeMoveCallWithRequestType({
    packageObjectId: MODULE_ADDRESS,
    module: 'flash',
    function: 'deposit',
    typeArguments: [],
    arguments: [
      LENDER_ADDRESS,
      FLASH_COIN
    ],
    gasBudget: 10000,
  });

  console.log(moveCallTxn);
  
  return;
}



main()