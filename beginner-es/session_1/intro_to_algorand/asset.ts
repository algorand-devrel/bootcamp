import { algodClient } from "./client";
import algosdk from "algosdk";
import { createAccount } from "./account";

export const createAsset = async(
  sender: algosdk.Account
) =>{
  const suggestedParams = await algodClient.getTransactionParams().do();
  // Create token
  const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: sender.addr, // The account that will create the asset
    assetName: 'My First Asset', // The name of the asset
    unitName: 'MFA', // The short name of the asset
    total: 100, // The total amount of the smallest unit of the asset
    decimals: 1, // The number of decimals in the asset
    reserve: sender.addr, // The address of the account that holds the uncirculated/unminted supply of the asset
    freeze: sender.addr, // The address of the account that can freeze or unfreeze the asset in a specific account
    defaultFrozen: false, // Whether or not the asset is frozen by default
    clawback: sender.addr, // The address of the account that can clawback the asset
    assetURL: 'https://developer.algorand.org', // The URL where more information about the asset can be retrieved
    manager: sender.addr, // The address of the account that can change the reserve, freeze, clawback, and manager addresses
  });

  const signedAssetCreateTxn = assetCreateTxn.signTxn(sender.sk);

  await algodClient.sendRawTransaction(signedAssetCreateTxn).do();
  console.log(`Sending asset create transaction ${assetCreateTxn.txID()}...`);

  await algosdk.waitForConfirmation(algodClient, assetCreateTxn.txID(), 3);

  const assetCreateInfo = await algodClient
  .pendingTransactionInformation(assetCreateTxn.txID()).do();

  console.log(`Transaction ${assetCreateTxn.txID()} confirmed! Asset ID: ${assetCreateInfo['asset-index']}`);

  return assetCreateInfo
}

export const transferAsset = async(
  sender: algosdk.Account,
  assetIndex: number
) => {
  const newAccount = await createAccount();
  const suggestedParams = await algodClient.getTransactionParams().do();

  const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: sender.addr,
    to: newAccount.addr,
    amount: 25,
    assetIndex
  });

  const signedAssetTransferTxn = assetTransferTxn.signTxn(sender.sk);
  
  try {
    console.log(`Sending asset trasnfer transaction ${assetTransferTxn.txID()}...`);
    await algodClient.sendRawTransaction(signedAssetTransferTxn).do();
  } catch (e: any) {
    console.log('ERROR', e.response.body.message);
  }

}

