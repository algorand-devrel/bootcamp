import { algodClient } from "./client";
import algosdk from "algosdk";
import { createAccount } from "./account";

export const groupTransfer = async(
  sender: algosdk.Account,
  assetIndex: number
) => {
  const newAccount = await createAccount();
  const suggestedParams = await algodClient.getTransactionParams().do();

  // Use an atomic transaction group to successfully transfer the asset

  // Fund new account
  // The account needs 0.2 ALGO to receiver an Asset
  // 0.1 ALGO is the minimum amount of ALGO needed to be included in the ledger
  // An additional 0.1 ALGO is needed for every asset an account holds, to rent the space in the ledger
  const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: sender.addr,
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

  // Transfer asset again
  const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: sender.addr,
    to: newAccount.addr,
    amount: 25,
    assetIndex
  });

  const txns = [fundTxn, optInTxn, assetTransferTxn];
  const txnGroup = algosdk.assignGroupID(txns);
  const signedTxns = [
    txnGroup[0].signTxn(sender.sk),
    txnGroup[1].signTxn(newAccount.sk),
    txnGroup[2].signTxn(sender.sk),
  ];

  const groupID = txnGroup[0].group;
  const encodedGroupID = groupID.toString('base64');

  console.log(`Sending atomic transaction group ${encodedGroupID}...`);
  await algodClient.sendRawTransaction(signedTxns).do();
  await algosdk.waitForConfirmation(algodClient, txnGroup[0].txID(), 3);
  console.log(`Transactions confirmed! Group ID: ${encodeURIComponent(encodedGroupID)}`);

}

