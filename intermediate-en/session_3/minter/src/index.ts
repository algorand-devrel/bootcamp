/* eslint-disable no-alert */
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { Web3Storage } from 'web3.storage';
import multihash from 'multihashes';
import CID from 'cids';
import PeraSession from './wallets/pera';

declare let W3S_TOKEN : string;
declare let NETWORK : 'localnet' | 'testnet';

// Construct with token and endpoint
const pera = new PeraSession();

const algodClient = algokit.getAlgoClient(NETWORK === 'localnet' ? algokit.getDefaultLocalNetConfig('algod') : algokit.getAlgoNodeConfig('testnet', 'algod'));
const kmdClient = NETWORK === 'localnet' ? new algosdk.Kmd('a'.repeat(64), 'http://localhost', 4002) : undefined;

const accountsMenu = document.getElementById('accounts') as HTMLSelectElement;

const nameInput = document.getElementById('name') as HTMLInputElement;
const unitNameInput = document.getElementById('unit') as HTMLInputElement;
const asaInput = document.getElementById('asa') as HTMLInputElement;

const buttonIds = ['connect', 'mint3', 'mint19', 'update'];
const buttons: { [key: string]: HTMLButtonElement } = {};
buttonIds.forEach((id) => {
  buttons[id] = document.getElementById(id) as HTMLButtonElement;
});

const fileInput = document.getElementById('upload') as HTMLInputElement;

const w3s = new Web3Storage({ token: W3S_TOKEN });

async function signer(txns: algosdk.Transaction[]) {
  if (NETWORK === 'localnet') {
    const acct = await algokit.getDispenserAccount(algodClient, kmdClient);
    return algosdk.makeBasicAccountTransactionSigner(acct)(txns, txns.map((_, i) => i));
  }

  return pera.signTxns(txns);
}

async function imageToArc3(file: File) {
  const imageFile = new File([await file.arrayBuffer()], file.name, { type: file.type });
  const imageRoot = await w3s.put([imageFile], { name: file.name });
  console.log('Image root', imageRoot);

  const metadata = JSON.stringify({
    decimals: 0,
    name: nameInput.value,
    unitName: unitNameInput.value,
    image: `ipfs://${imageRoot}/${file.name}`,
    image_mimetype: file.type,
    properties: {},
  });

  const metadataFile = new File([metadata], 'metadata.json', { type: 'text/plain' });
  const metadataRoot = await w3s.put([metadataFile], { name: 'metadata.json' });
  console.log('Metadata root', metadataRoot);

  return metadataRoot;
}

function cidStringToAddress(cidString: string): string {
  const cid = new CID(cidString);

  return algosdk.encodeAddress(multihash.decode(cid.multihash).digest);
}

buttons.connect.onclick = async () => {
  if (NETWORK === 'localnet') {
    const acct = await algokit.getDispenserAccount(algodClient, kmdClient);
    accountsMenu.add(new Option(acct.addr, acct.addr));
  } else {
    await pera.getAccounts();
    pera.accounts.forEach((account) => {
      accountsMenu.add(new Option(account, account));
    });
  }

  buttons.mint3.disabled = false;
  buttons.mint19.disabled = false;
  buttons.update.disabled = false;
};

buttons.mint3.onclick = async () => {
  const metadataRoot = await imageToArc3(fileInput.files[0]);

  const sender = { addr: accountsMenu.selectedOptions[0].value, signer };

  const atc = new algosdk.AtomicTransactionComposer();

  const mintTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    suggestedParams: await algodClient.getTransactionParams().do(),
    from: sender.addr,
    assetName: nameInput.value,
    unitName: unitNameInput.value,
    assetURL: `ipfs://${metadataRoot}/metadata.json#arc3`,
    defaultFrozen: false,
    total: 1,
    decimals: 0,
  });

  atc.addTransaction({ txn: mintTxn, signer });

  await atc.execute(algodClient, 3);

  const assetID = (await algodClient.pendingTransactionInformation(mintTxn.txID()).do())['asset-index'];

  document.getElementById('status').innerHTML = `NFT minted! See the asset on <a href='https://app.dappflow.org/explorer/asset/${assetID}/transactions'>Dappflow</a>`;
};

buttons.mint19.onclick = async () => {
  const metadataRoot = await imageToArc3(fileInput.files[0]);

  const sender = { addr: accountsMenu.selectedOptions[0].value, signer };

  const atc = new algosdk.AtomicTransactionComposer();

  console.log('addr', cidStringToAddress(metadataRoot))

  const mintTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    suggestedParams: await algodClient.getTransactionParams().do(),
    from: sender.addr,
    assetName: nameInput.value,
    unitName: unitNameInput.value,
    assetURL: 'template-ipfs://{ipfscid:1:dag-pb:reserve:sha2-256}/metadata.json#arc3',
    reserve: cidStringToAddress(metadataRoot),
    manager: sender.addr,
    defaultFrozen: false,
    total: 1,
    decimals: 0,
  });

  atc.addTransaction({ txn: mintTxn, signer });

  await atc.execute(algodClient, 3);

  const assetID = (await algodClient.pendingTransactionInformation(mintTxn.txID()).do())['asset-index'];

  document.getElementById('status').innerHTML = `NFT minted! See the asset on <a href='https://app.dappflow.org/explorer/asset/${assetID}/transactions'>Dappflow</a>`;
  asaInput.value = assetID;
};

buttons.update.onclick = async () => {
  const metadataRoot = await imageToArc3(fileInput.files[0]);

  const sender = { addr: accountsMenu.selectedOptions[0].value, signer };

  const atc = new algosdk.AtomicTransactionComposer();

  const updateTxn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
    suggestedParams: await algodClient.getTransactionParams().do(),
    assetIndex: asaInput.valueAsNumber,
    from: sender.addr,
    manager: sender.addr,
    reserve: cidStringToAddress(metadataRoot),
    strictEmptyAddressChecking: false,
  });

  atc.addTransaction({ txn: updateTxn, signer });

  await atc.execute(algodClient, 3);

  document.getElementById('status').innerHTML = `NFT updated! See the asset on <a href='https://app.dappflow.org/explorer/asset/${asaInput.valueAsNumber}/transactions'>Dappflow</a>`;
};
