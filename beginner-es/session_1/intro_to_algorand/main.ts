const reader = require('prompt-sync')();

import { algodClient } from "./client";
import { createAccount, waitForBalance } from "./account";
import { makePayment } from "./pay";
import { createAsset, transferAsset } from "./asset";
import { waitForInput } from "./utils";
import { groupTransfer } from "./group";
import { appCall, getGlobalState } from "./app";

(async () => {
  const account = await createAccount();
  console.log('Please send funds to the account. Script will continue once ALGO is received...');
  await waitForBalance(account.addr, algodClient);
  
  await waitForInput();
  await makePayment(account);
  
  await waitForInput();
  const asset = await createAsset(account);

  await waitForInput();
  await transferAsset(account, asset["asset-index"])

  await waitForInput();
  await groupTransfer(account, asset["asset-index"])

  await waitForInput();
  const appID = parseInt(reader("Inserta el app ID: "))
  const name = reader("Inserte un nombre: ")
  await appCall(account, appID, name);

  await waitForInput();
  await getGlobalState(appID);
})()
