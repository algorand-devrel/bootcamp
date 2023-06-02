import algosdk from "algosdk";

import { algodClient } from "./client";
import { createAccount } from "./account";

export const makePayment = async(
  sender: algosdk.Account,
) => {
  const newAccount = await createAccount();
  const suggestedParams = await algodClient.getTransactionParams().do();

  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: sender.addr,
    to: newAccount.addr,
    amount: 0.5 * 1e6, // * 1e6 to convert from ALGO to microALGO
  });

  const signedPaymentTxn = paymentTxn.signTxn(sender.sk);

  await algodClient.sendRawTransaction(signedPaymentTxn).do();
  console.log(`Sending payment transaction ${paymentTxn.txID()}...`);

  await algosdk.waitForConfirmation(algodClient, paymentTxn.txID(), 3);

  console.log(`Payment transaction ${paymentTxn.txID()} confirmed! Txn ID: ${paymentTxn.txID()}`);
}