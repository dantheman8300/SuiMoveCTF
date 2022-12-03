import { CertifiedTransaction, Ed25519Keypair, JsonRpcProvider, RawSigner, SuiCertifiedTransactionEffects } from '@mysten/sui.js';
import dotenv from "dotenv";
import { exit } from 'process';


// Note: Make sure to update the address of the challenge package and the hero object
// Address of the module
const MODULE_ADDRESS = '';

// Address/Object id of the ResourceObject
const RESOURCE_OBJECT_ID = '';

const GAS_BUDGET = 1000000;

// The encrypted flag found in the module
// We want to find the plaintext that was used to encrypt this
const ENCRYPTED_FLAG = [
  19, 16, 17, 
  11, 9, 21, 
  18, 2, 3,
  22, 7, 4, 
  25, 21, 5, 
  7, 23, 6, 
  23, 5, 13, 
  3, 5, 9, 
  16, 12, 22, 
  14, 3, 14, 
  12, 22, 18, 
  4, 3, 9, 
  2, 19, 5, 
  16, 7, 20, 
  1, 11, 18, 
  23, 4, 15, 
  20, 5, 24, 
  9, 1, 12, 
  5, 16, 10, 
  7, 2, 1, 
  21, 1, 25, 
  18, 22, 2, 
  2, 7, 25, 
  15, 7, 10
];

// A portion of the plaintext that we know
const KNOWN_PLAINTEXT = [
  4, 15, 11,
  0, 13, 4, 
  19, 19, 19
];

// Max key value being tested
const MAX_NUM = 600;

// Function to figure out the key (data2) 
function getKey(keyMax: number) {

  let possible_key_vals = [] as number[][];

  for (let k11 = 0; k11 < keyMax; k11++) {
    for (let k12 = 0; k12 < keyMax; k12++) {
      for (let k13 = 0; k13 < keyMax; k13++) {
        // console.log(`Solving for key: ${k11}, ${k12}, ${k13}`);
        if (
          (((k11 * KNOWN_PLAINTEXT[0]) + (k12 * KNOWN_PLAINTEXT[1]) + (k13 * KNOWN_PLAINTEXT[2])) % 26) === ENCRYPTED_FLAG[0] &&
          (((k11 * KNOWN_PLAINTEXT[3]) + (k12 * KNOWN_PLAINTEXT[4]) + (k13 * KNOWN_PLAINTEXT[5])) % 26) === ENCRYPTED_FLAG[3] &&
          (((k11 * KNOWN_PLAINTEXT[6]) + (k12 * KNOWN_PLAINTEXT[7]) + (k13 * KNOWN_PLAINTEXT[8])) % 26) === ENCRYPTED_FLAG[6]
        ) {
          // console.log(`Found key: ${k11}, ${k12}, ${k13}`);
          // Find possible key values for 2nd item
          for (let k21 = 0; k21 < keyMax; k21++) {
            for (let k22 = 0; k22 < keyMax; k22++) {
              for (let k23 = 0; k23 < keyMax; k23++) {
                // console.log(`Solving for key: ${k11}, ${k12}, ${k13}, ${k21}, ${k22}, ${k23}`);
                if (
                  (((k21 * KNOWN_PLAINTEXT[0]) + (k22 * KNOWN_PLAINTEXT[1]) + (k23 * KNOWN_PLAINTEXT[2])) % 26) === ENCRYPTED_FLAG[1] &&
                  (((k21 * KNOWN_PLAINTEXT[3]) + (k22 * KNOWN_PLAINTEXT[4]) + (k23 * KNOWN_PLAINTEXT[5])) % 26) === ENCRYPTED_FLAG[4] &&
                  (((k21 * KNOWN_PLAINTEXT[6]) + (k22 * KNOWN_PLAINTEXT[7]) + (k23 * KNOWN_PLAINTEXT[8])) % 26) === ENCRYPTED_FLAG[7]
                ) {
                  // Find possible key values for 3rd item
                  for (let k31 = 0; k31 < keyMax; k31++) {
                    for (let k32 = 0; k32 < keyMax; k32++) {
                      for (let k33 = 0; k33 < keyMax; k33++) {
                        // console.log(`Solving for key: ${[k11, k12, k13, k21, k22, k23, k31, k32, k33]}`);
                        if (
                          (((k31 * KNOWN_PLAINTEXT[0]) + (k32 * KNOWN_PLAINTEXT[1]) + (k33 * KNOWN_PLAINTEXT[2])) % 26) === ENCRYPTED_FLAG[2] &&
                          (((k31 * KNOWN_PLAINTEXT[3]) + (k32 * KNOWN_PLAINTEXT[4]) + (k33 * KNOWN_PLAINTEXT[5])) % 26) === ENCRYPTED_FLAG[5] &&
                          (((k31 * KNOWN_PLAINTEXT[6]) + (k32 * KNOWN_PLAINTEXT[7]) + (k33 * KNOWN_PLAINTEXT[8])) % 26) === ENCRYPTED_FLAG[8]
                        ) {
                          console.log(`Found key: [${k11}, ${k12}, ${k13}, ${k21}, ${k22}, ${k23}, ${k31}, ${k32}, ${k33}]`);
                          possible_key_vals.push([k11, k12, k13, k21, k22, k23, k31, k32, k33]);
                          return [k11, k12, k13, k21, k22, k23, k31, k32, k33];
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // No key was found
  console.log(`No key found`);
  return
  
}

// Function to decrypt the flag using the key
function getPlaintext(key: number[]) {
  let plaintext = [] as number[];

  // Helper function to check all possible plaintext values
  const findPlaintext = (index: number) => {
    for(let a = 0; a < 100; a++) {
      for(let b = 0; b < 100; b++) {
        for(let c = 0; c < 100; c++) {
          if (
            (((key[0] * a) + (key[1] * b) + (key[2] * c)) % 26) === ENCRYPTED_FLAG[index] &&
            (((key[3] * a) + (key[4] * b) + (key[5] * c)) % 26) === ENCRYPTED_FLAG[index + 1] &&
            (((key[6] * a) + (key[7] * b) + (key[8] * c)) % 26) === ENCRYPTED_FLAG[index + 2]
          ) {
            return [a, b, c];
          }
        }
      }
    }
    return [-1, -1, -1];
  }
  
  // Generate the plaintext
  for (let i = 0; i < ENCRYPTED_FLAG.length; i+= 3) {
    plaintext.push(...findPlaintext(i));
  }

  // Slice to ignore the 9 values that are provided in the module
  return plaintext.slice(9);
}

// Function to call the module's unlock function with the key and plaintext
async function unlock(key: number[], plaintext: number[]) {

  dotenv.config();
  if (process.env.RECOVERY_PHRASE == undefined) {
    console.error('RECOVERY_PHRASE not set');
    exit(1);
  }

  // connect to local RPC server
  const provider = new JsonRpcProvider();

  // Create signer instance
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

  console.log(`Signer address: ${await signer.getAddress()}`);

  // Call the get flag function in our solution module
  console.log(`Calling movectf_unlock() in solution module...`);
  const moveCallTxn = await signer.executeMoveCall({
    packageObjectId: MODULE_ADDRESS,
    module: 'move_lock',
    function: 'movectf_unlock',
    typeArguments: [],
    arguments: [
      plaintext, 
      key,
      RESOURCE_OBJECT_ID
    ],
    gasBudget: GAS_BUDGET,
  }) as {
    EffectsCert: {
        certificate: CertifiedTransaction;
        effects: SuiCertifiedTransactionEffects;
    }
  };
  console.log('Unlock transaction:', moveCallTxn.EffectsCert.certificate.transactionDigest);

  // Fetch information about the ResourceObject
  const resourceObject = await provider.getObject(RESOURCE_OBJECT_ID);
  const resourceObjectDetails = resourceObject.details as unknown as {data: {fields: {balance: number, q1: boolean}}};
  const q1 = resourceObjectDetails.data.fields.q1;

  // Exit if q1 is not true
  if (!q1) {
    console.log(`Q1 is not true. Exiting...`);
    return;
  }

  // Use the unlocked resource object to get the flag
  console.log(`Calling get_flag() in solution module...`);
  const moveCallTxn2 = await signer.executeMoveCall({
    packageObjectId: MODULE_ADDRESS,
    module: 'move_lock',
    function: 'get_flag',
    typeArguments: [],
    arguments: [
      RESOURCE_OBJECT_ID
    ],
    gasBudget: GAS_BUDGET,
  }) as {
    EffectsCert: {
        certificate: CertifiedTransaction;
        effects: SuiCertifiedTransactionEffects;
    }
  };
  console.log('Get flag transaction:', moveCallTxn2.EffectsCert.certificate.transactionDigest);
  
  return;
}

async function main() {
  const key = getKey(MAX_NUM);

  // Exit program if key was not found
  if (!key) {
    console.log(`No key found`);
    console.log(`Exiting...`);
    return;
  }

  // Decrypt the flag
  const plaintext = getPlaintext(key);
  console.log(`Plaintext: ${plaintext}`);

  // Unlock the resource object
  console.log(`Unlocking resource object...`);
  await unlock(key, plaintext);

  return
}

main();