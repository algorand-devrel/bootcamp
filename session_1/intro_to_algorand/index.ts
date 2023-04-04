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

  // Create connection to network via public algod API
  const algodToken = '';
  const algodServer = 'https://testnet-api.algonode.cloud';
  const algodPort = undefined;
  const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

  // get accountInfo
  let accountInfo = await algodClient.accountInformation(account.addr).do();

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

  const suggestedParams = await algodClient.getTransactionParams().do();

  const roundsToWait = 3;

  // Create token
  const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: account.addr,
    assetName: 'Matthew Asset',
    unitName: 'MA',
    total: 100,
    decimals: 1,
    reserve: account.addr,
    defaultFrozen: false,
    freeze: account.addr,
    clawback: account.addr,
    assetURL: 'https://developer.algorand.org',
    manager: account.addr,
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

  // Atomic transactions

  // Fund account, opt in, and then transfer asset
  const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: account.addr,
    to: newAccount.addr,
    amount: 200_000, // 0.2 ALGO,
    suggestedParams: { ...suggestedParams, fee: 2 * algosdk.ALGORAND_MIN_TX_FEE, flatFee: true },
  });

  // Opt-in: 0 asset transfer to oneself
  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: newAccount.addr,
    to: newAccount.addr,
    amount: 0,
    assetIndex,
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

  const approvalCompileResult = await algodClient.compile(approvalSource).do();
  const clearCompileResult = await algodClient.compile(clearSource).do();

  const approvalBytes = new Uint8Array(Buffer.from(approvalCompileResult.result, 'base64'));
  const clearBytes = new Uint8Array(Buffer.from(clearCompileResult.result, 'base64'));

  const contract = new algosdk.ABIContract(abi);
  const createMethodSelector = algosdk.getMethodByName(contract.methods, 'create').getSelector();

  const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
    suggestedParams,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    from: account.addr,
    approvalProgram: approvalBytes,
    clearProgram: clearBytes,
    numGlobalByteSlices: 2,
    numGlobalInts: 1,
    numLocalByteSlices: 0,
    numLocalInts: 0,
    appArgs: [createMethodSelector, (new algosdk.ABIStringType()).encode('Alice')],
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
    signer: async (unsignedTxns) => unsignedTxns.map((t) => t.signTxn(account.sk)),
    appID: appIndex,
    method: algosdk.getMethodByName(contract.methods, 'increment'),
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
