import algosdk from "algosdk";
import { algodClient } from "./client";
import * as abi from "./contract/contract.json"

// Call app with ATC
const atc = new algosdk.AtomicTransactionComposer();

export const appCall = async(
  sender: algosdk.Account,
  appIndex: number,
  name: string
) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  const contract = new algosdk.ABIContract(abi);
  atc.addMethodCall({
    suggestedParams,
    sender: sender.addr,
    // Signer is a function that takes in unsigned txns and returns signed txns
    signer: async (unsignedTxns) => unsignedTxns.map((t) => t.signTxn(sender.sk)),
    appID: appIndex,
    method: algosdk.getMethodByName(contract.methods, 'increment'),
    // Note how we don't have to manually encode the string
    methodArgs: [name],
  });
  
  await atc.execute(algodClient, 3);
  console.log(`Counter incremented!`);
}

export const getGlobalState = async(
  appIndex: number
) => {
  // Decode app state
  // Read app state
  const appInfo = await algodClient.getApplicationByID(appIndex).do();
  const globalState = appInfo.params['global-state'] as {key: string, value: {bytes: string, type: number, uint: number}}[];
  console.log('Raw Global State', globalState);
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