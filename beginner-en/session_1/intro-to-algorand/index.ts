/* eslint-disable no-console */
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';

async function main() {
  const alice = algosdk.generateAccount();

  console.log(alice.addr);

  const algod = algokit.getAlgoClient(algokit.getDefaultLocalNetConfig('algod'));

  console.log(await algod.versionsCheck().do());

  // Get information about alice from algod

  console.log(await algod.accountInformation(alice.addr).do());

  // Get some ALGO into alice's account

  const kmd = algokit.getAlgoKmdClient(algokit.getDefaultLocalNetConfig('kmd'));

  await algokit.ensureFunded(
    {
      accountToFund: alice.addr,
      minSpendingBalance: algokit.algos(10),
    },
    algod,
    kmd,
  );

  console.log(await algod.accountInformation(alice.addr).do());

  // ASA === Algorand Standard Asset
  const asaCreation = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: alice.addr,
    total: 1,
    // Total is 100
    // Decimals: 0 => 100 non-divisible tokens
    // Decimals: 1 => 10 tokens divided by 10
    // Decimals: 2 => 1 token divided by 100

    // Decimals, is the amount of decimal places your token supports
    decimals: 0,
    defaultFrozen: false,
    suggestedParams: await algod.getTransactionParams().do(),
  });

  console.log(asaCreation);

  const createResult = await algokit.sendTransaction(
    {
      transaction: asaCreation,
      from: alice,
    },
    algod,
  );

  console.log(createResult);

  const assetIndex = Number(createResult.confirmation!.assetIndex);

  console.log(assetIndex);

  const bob = algosdk.generateAccount();

  const asaTransfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: alice.addr,
    to: bob.addr,
    assetIndex,
    amount: 1,
    suggestedParams: await algod.getTransactionParams().do(),
  });

  // Write code here, to send asaTransfer to the network
}

main();
