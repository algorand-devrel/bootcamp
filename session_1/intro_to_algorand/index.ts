/* eslint-disable no-console */
import algosdk from 'algosdk';
import readline from 'readline';
import process from 'process';
import fs from 'fs';
import * as abi from './contract/contract.json';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const skipPrompts = process.argv.includes('--skip-prompts');

function waitForInput() {
  if (skipPrompts === true) return new Promise((resolve) => { resolve(true); });
  return new Promise((resolve) => {
    rl.question('Press enter to continue...', resolve);
  });
}

async function main() {
  // Account creation
  const account = algosdk.generateAccount();
  console.log('Mnemonic:', algosdk.secretKeyToMnemonic(account.sk));
  console.log('Address:', account.addr);

  await waitForInput();

  // Create connection to network via public algod API
  const algodToken = '';
  const algodServer = 'https://testnet-api.algonode.cloud';
  const algodPort = undefined;
  const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

  // get accountInfo
  let accountInfo = await algodClient.accountInformation(account.addr).do();

  console.log('accountInfo:', accountInfo);

  await waitForInput();

  console.log('Dispsene ALGO at https://testnet.algoexplorer.io/dispenser. Script will continue once ALGO is received...');

  // Check balance of account via algod
  const waitForBalance = async () => {
    accountInfo = await algodClient.accountInformation(account.addr).do();

    const balance = accountInfo.amount;

    if (balance === 0) {
      await waitForBalance();
    }
  };

  await waitForBalance();

  console.log(`${account.addr} funded!`);

  await waitForInput();

  // Get basic information needed for every transcation
  const suggestedParams = await algodClient.getTransactionParams().do();
  console.log('suggestedParams:', suggestedParams);

  await waitForInput();

  // First transaction: payment
  const dispenserAddress = 'DISPE57MNLYKOMOK3H5IMBAYOYW3YL2CSI6MDOG3RDXSMET35DG4W6SOTI';

  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: account.addr,
    to: dispenserAddress,
    amount: 0.5 * 1e6, // * 1e6 to convert from ALGO to microALGO
  });

  const signedPaymentTxn = paymentTxn.signTxn(account.sk);

  await algodClient.sendRawTransaction(signedPaymentTxn).do();
  console.log(`Sending payment transaction ${paymentTxn.txID()}...`);

  const roundsToWait = 3;
  await algosdk.waitForConfirmation(algodClient, paymentTxn.txID(), roundsToWait);

  console.log(`Payment transaction ${paymentTxn.txID()} confirmed! See it at https://testnet.algoscan.app/tx/${paymentTxn.txID()}`);

  await waitForInput();

  // Create token
  const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: account.addr, // The account that will create the asset
    assetName: 'My First Asset', // The name of the asset
    unitName: 'MFA', // The short name of the asset
    total: 100, // The total amount of the smallest unit of the asset
    decimals: 1, // The number of decimals in the asset
    reserve: account.addr, // The address of the account that holds the uncirculated/unminted supply of the asset
    freeze: account.addr, // The address of the account that can freeze or unfreeze the asset in a specific account
    defaultFrozen: false, // Whether or not the asset is frozen by default
    clawback: account.addr, // The address of the account that can clawback the asset
    assetURL: 'https://developer.algorand.org', // The URL where more information about the asset can be retrieved
    manager: account.addr, // The address of the account that can change the reserve, freeze, clawback, and manager addresses
  });

  const signedAssetCreateTxn = assetCreateTxn.signTxn(account.sk);

  await algodClient.sendRawTransaction(signedAssetCreateTxn).do();
  console.log(`Sending asset create transaction ${assetCreateTxn.txID()}...`);

  await algosdk.waitForConfirmation(algodClient, assetCreateTxn.txID(), roundsToWait);

  const assetCreateInfo = await algodClient
    .pendingTransactionInformation(assetCreateTxn.txID()).do();

  const assetIndex = assetCreateInfo['asset-index'];

  console.log(`Asset ${assetIndex} created! See the transaction at https://testnet.algoscan.app/tx/${assetCreateTxn.txID()}`);

  await waitForInput();

  // Transfer asset
  const newAccount = algosdk.generateAccount();

  const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: account.addr,
    to: newAccount.addr,
    amount: 25,
    assetIndex,
  });

  const signedAssetTransferTxn = assetTransferTxn.signTxn(account.sk);

  try {
    await algodClient.sendRawTransaction(signedAssetTransferTxn).do();
  } catch (e) {
    console.log('ERROR', e.response.body.message);
  }

  await waitForInput();

  // Use an atomic transaction group to successfully transfer the asset

  // Fund new account
  // The account needs 0.2 ALGO to receiver an Asset
  // 0.1 ALGO is the minimum amount of ALGO needed to be included in the ledger
  // An additional 0.1 ALGO is needed for every asset an account holds, to rent the space in the ledger
  const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: account.addr,
    to: newAccount.addr,
    amount: 200_000, // 0.2 ALGO,
    // Double the fee so newAccount doesn't need to pay a fee
    suggestedParams: { ...suggestedParams, fee: 2 * algosdk.ALGORAND_MIN_TX_FEE, flatFee: true },
  });

  // Opt-in: 0 asset transfer to oneself
  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: newAccount.addr,
    to: newAccount.addr,
    amount: 0,
    assetIndex,
    // Set fee to zero since account will be paying double fee
    suggestedParams: { ...suggestedParams, fee: 0, flatFee: true },
  });

  const txns = [fundTxn, optInTxn, assetTransferTxn];
  const txnGroup = algosdk.assignGroupID(txns);
  const signedTxns = [
    txnGroup[0].signTxn(account.sk),
    txnGroup[1].signTxn(newAccount.sk),
    txnGroup[2].signTxn(account.sk),
  ];

  const groupID = txnGroup[0].group!;
  const encodedGroupID = groupID.toString('base64');

  console.log(`Sending atomic transaction group ${encodedGroupID}...`);
  await algodClient.sendRawTransaction(signedTxns).do();
  await algosdk.waitForConfirmation(algodClient, txnGroup[0].txID(), roundsToWait);
  console.log(`Transactions confirmed! See them at https://testnet.algoscan.app/tx/group/${encodeURIComponent(encodedGroupID)}`);

  await waitForInput();

  // create app
  const approvalSource = fs.readFileSync('./contract/approval.teal', 'utf8');
  const clearSource = fs.readFileSync('./contract/clear.teal', 'utf8');

  // Compile the TEAL programs
  const approvalCompileResult = await algodClient.compile(approvalSource).do();
  const clearCompileResult = await algodClient.compile(clearSource).do();

  // Convert the compilation result to Uint8Array
  const approvalBytes = new Uint8Array(Buffer.from(approvalCompileResult.result, 'base64'));
  const clearBytes = new Uint8Array(Buffer.from(clearCompileResult.result, 'base64'));

  // Read our ABI JSON file to create an ABIContract object
  const contract = new algosdk.ABIContract(abi);

  // Get the selector for the create method
  const createMethodSelector = algosdk.getMethodByName(contract.methods, 'create').getSelector();

  const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
    suggestedParams,
    onComplete: algosdk.OnApplicationComplete.NoOpOC, // Action to take after the appcall passes
    from: account.addr,
    approvalProgram: approvalBytes, // TEAL program to run on app calls and creation
    clearProgram: clearBytes, // TEAL program to run when local account state is deleted
    numGlobalByteSlices: 2, // Number of byteslices stored in global state
    numGlobalInts: 1, // Number of integers stored in global state
    numLocalByteSlices: 0, // Number of byteslices stored in local state
    numLocalInts: 0, // Number of integers stored in local state
    appArgs: [
      createMethodSelector, // First argument is always the selector of the method we're calling
      (new algosdk.ABIStringType()).encode('Alice') // Following arguments are the arguments to the method
    ],
  });

  const signedAppCreateTxn = appCreateTxn.signTxn(account.sk);
  await algodClient.sendRawTransaction(signedAppCreateTxn).do();

  console.log(`Sending transaction ${appCreateTxn.txID()}...`);
  await algosdk.waitForConfirmation(algodClient, appCreateTxn.txID(), roundsToWait);

  const appCreateInfo = await algodClient
    .pendingTransactionInformation(appCreateTxn.txID()).do();

  const appIndex = appCreateInfo['application-index'];

  console.log(`App ${appIndex} created! See the transaction at https://testnet.algoscan.app/tx/${appCreateTxn.txID()}`);

  await waitForInput();

  // Call app with ATC
  const atc = new algosdk.AtomicTransactionComposer();

  atc.addMethodCall({
    suggestedParams,
    sender: account.addr,
    // Signer is a function that takes in unsigned txns and returns signed txns
    signer: async (unsignedTxns) => unsignedTxns.map((t) => t.signTxn(account.sk)),
    appID: appIndex,
    method: algosdk.getMethodByName(contract.methods, 'increment'),
    // Note how we don't have to manually encode the string
    methodArgs: ['Bob'],
  });

  await atc.execute(algodClient, roundsToWait);
  console.log(`Counter incremented! See the app at https://testnet.algoscan.app/app/${appIndex}`);

  // Read app state
  const appInfo = await algodClient.getApplicationByID(appIndex).do();
  const globalState = appInfo.params['global-state'] as {key: string, value: {bytes: string, type: number, uint: number}}[];
  console.log('Raw Global State', globalState);

  await waitForInput();

  // Decode app state
  globalState.forEach((state) => {
    const key = Buffer.from(state.key, 'base64').toString();
    const binaryBytes = Buffer.from(state.value.bytes, 'base64');

    switch (key) {
      case 'counter':
        console.log('Counter:', state.value.uint);
        break;
      case 'last_caller_address':
        console.log('Last Caller Address:', algosdk.encodeAddress(binaryBytes));
        break;
      case 'last_caller_name':
        console.log('Last Caller Name:', binaryBytes.toString());
        break;
      default:
        break;
    }
  });
}

main().then(() => rl.close());
