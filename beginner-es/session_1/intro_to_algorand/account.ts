import algosdk from "algosdk";
import { algodClient } from "./client"

export const createAccount = async() => {
  const account = algosdk.generateAccount()
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
  console.log("NEW ACCOUNT CREATED: ")
  console.log(`==> Address: ${account.addr}`)
  console.log(`==> Secret Key: ${account.sk}`)
  console.log(`==> Mnemonic: ${algosdk.secretKeyToMnemonic(account.sk)}`)
  return account;
}

export const waitForBalance = async(addr:string, algodClient: algosdk.Algodv2) => {
  const accountInfo = await algodClient.accountInformation(addr).do();
  const balance = accountInfo.amount;
  if (balance === 0) {
    await waitForBalance(addr, algodClient);
  } else {
    console.log(`${addr} has funds!`);
  }
}

