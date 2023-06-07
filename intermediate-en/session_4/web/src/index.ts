/* eslint-disable no-alert */
import * as algokit from '@algorandfoundation/algokit-utils';
import { ApplicationClient } from '@algorandfoundation/algokit-utils/types/app-client';
import algosdk from 'algosdk';
import daoAppSpec from '../../artifacts/DAO/application.json';
import minterAppSpec from '../../artifacts/Minter/application.json'
import PeraSession from './wallets/pera';
import { Web3Storage } from 'web3.storage';
import multihash from 'multihashes';
import CID from 'cids';

declare let W3S_TOKEN : string;
declare let NETWORK : 'localnet' | 'testnet';

const BOX_CREATE_COST = 0.0025e6;
const BOX_BYTE_COST = 0.0004e6;

const pera = new PeraSession();

const w3s = new Web3Storage({ token: W3S_TOKEN });

const algodClient = algokit.getAlgoClient(NETWORK === 'localnet' ? algokit.getDefaultLocalNetConfig('algod') : algokit.getAlgoNodeConfig('testnet', 'algod'));
const indexerClient = algokit.getAlgoIndexerClient(NETWORK === 'localnet' ? algokit.getDefaultLocalNetConfig('indexer') : algokit.getAlgoNodeConfig('testnet', 'indexer'));
const kmdClient = NETWORK === 'localnet' ? new algosdk.Kmd('a'.repeat(64), 'http://localhost', 4002) : undefined;

let minterAppId: number;
let minterApp: ApplicationClient;
let daoAppId: number;
let daoApp: ApplicationClient;

const accountsMenu = document.getElementById('accounts') as HTMLSelectElement;

const nameInput = document.getElementById('name') as HTMLInputElement;
const unitNameInput = document.getElementById('unit') as HTMLInputElement;
const proposerInput = document.getElementById('proposer') as HTMLInputElement;
const idInput = document.getElementById('id') as HTMLInputElement;
const fileInput = document.getElementById('upload') as HTMLInputElement;


const buttonIds = ['connect', 'create', 'submit', 'vote', 'mint'];
const buttons: { [key: string]: HTMLButtonElement } = {};
buttonIds.forEach((id) => {
  buttons[id] = document.getElementById(id) as HTMLButtonElement;
});

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

async function signer(txns: algosdk.Transaction[]) {
  if (NETWORK === 'localnet') {
    const acct = await algokit.getDispenserAccount(algodClient, kmdClient);
    return algosdk.makeBasicAccountTransactionSigner(acct)(txns, txns.map((_, i) => i));
  }

  return pera.signTxns(txns);
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

  buttons.create.disabled = false;
};

buttons.create.onclick = async () => {
  document.getElementById('status').innerHTML = 'Creating DAO...';
  const sender = {
    addr: accountsMenu.selectedOptions[0].value,
    signer,
  };

  if (!minterAppId) {
    console.log('Creating minter')
    minterApp = algokit.getAppClient(
      {
        app: JSON.stringify(minterAppSpec),
        sender,
        id: 0
      },
      algodClient,
    );

    await minterApp.create();
    await minterApp.fundAppAccount(algokit.microAlgos(100_000))
    minterAppId = (await minterApp.getAppReference()).appId;
  }

  daoApp = algokit.getAppClient(
    {
      app: JSON.stringify(daoAppSpec),
      sender,
      creatorAddress: sender.addr,
      indexer: indexerClient,
      name: `dao-${Date.now()}`
    },
    algodClient,
  );

  const { appId, appAddress } = await daoApp.deploy({sender, deployTimeParams: {'MINTER_APP': minterAppId}});

  daoAppId = appId;

  document.getElementById('status').innerHTML = `App created with id ${appId} and address ${appAddress}. See it <a href='https://app.dappflow.org/explorer/application/${appId}'>here</a>`;

  buttons.submit.disabled = false;
  buttons.create.disabled = true;
};

buttons.submit.onclick = async () => {
  document.getElementById('status').innerHTML = 'Sending proposal...';
  const sender = {
    addr: accountsMenu.selectedOptions[0].value,
    signer,
  };

  const proposalId = (await daoApp.getBoxNames()).filter((b) => {
    // filter out non proposal boxes
    if (!b.name.startsWith('p-')) return false;
    // filter out proposals that aren't from the sender
    return algosdk.encodeAddress(b.nameRaw.slice(2, 34)) === sender.addr;
  }).length;

  const proposalKeyType = algosdk.ABIType.from('(address,uint64)');
  const proposalKeyPrefix = new Uint8Array(Buffer.from('p-'));
  const proposalKey = new Uint8Array([
    ...proposalKeyPrefix,
    ...proposalKeyType.encode([sender.addr, proposalId]),
  ]);

  const metadataRoot = await imageToArc3(fileInput.files[0]);
  const proposalObject = {
    name: nameInput.value,
    unitName: unitNameInput.value,
    reserve: cidStringToAddress(metadataRoot)
  };

  const boxMbr = BOX_CREATE_COST + (Object.values(proposalObject)
    .reduce((totalLength, v) => totalLength + v.length, 0) + proposalKey.byteLength
  ) * BOX_BYTE_COST;

  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams: await algodClient.getTransactionParams().do(),
    amount: 100_000 + boxMbr,
    from: sender.addr,
    to: algosdk.getApplicationAddress(daoAppId),
  });

  const args = [Object.values(proposalObject), proposalId, { txn: payment, signer }];

  proposerInput.value = sender.addr;

  await daoApp.call({
    method: 'add_proposal',
    methodArgs: { args, boxes: [{ appIndex: 0, name: proposalKey }] },
    sender,
  });

  buttons.vote.disabled = false;
  document.getElementById('status').innerHTML = `Proposal submitted! See the app <a href='https://app.dappflow.org/explorer/application/${daoAppId}'>here</a>`;
};

buttons.vote.onclick = async () => {
  const sender = {
    addr: accountsMenu.selectedOptions[0].value,
    signer,
  };

  const proposalKeyType = algosdk.ABIType.from('(address,uint64)');
  const encodedKey = proposalKeyType.encode([sender.addr, idInput.valueAsNumber]);
  const proposalKey = new Uint8Array([
    ...new Uint8Array(Buffer.from('p-')),
    ...encodedKey,
  ]);

  const proposalBox = (await daoApp.getBoxNames()).find((b) => b.nameBase64 === Buffer.from(proposalKey).toString('base64'));

  if (!proposalBox) {
    alert('Proposal not found!');
    return;
  }

  const votesKey = new Uint8Array([
    ...new Uint8Array(Buffer.from('v-')),
    ...encodedKey,
  ]);

  const hasVotedKey = new Uint8Array([
    ...new Uint8Array(Buffer.from('h-')),
    ...algosdk.decodeAddress(sender.addr).publicKey,
  ]);

  const hasVoted = (await daoApp.getBoxNames()).find((b) => {
    // filter out non has_voted boxes
    if (!b.name.startsWith('h-')) return false;
    // filter out has_voted boxes that don't aren't for the sender
    return algosdk.encodeAddress(b.nameRaw.slice(2, 34)) === sender.addr;
  });

  if (hasVoted) {
    alert('You have already voted!');
    return;
  }

  await daoApp.fundAppAccount(algokit.microAlgos(33400));

  await daoApp.call({
    method: 'vote',
    methodArgs: {
      args: [proposerInput.value, idInput.valueAsNumber],
      boxes: [
        { appIndex: 0, name: proposalKey },
        { appIndex: 0, name: votesKey },
        { appIndex: 0, name: hasVotedKey },

      ],
    },
    sender,
  });

  document.getElementById('status').innerHTML = `Vote submitted! See the app <a href='https://app.dappflow.org/explorer/application/${daoAppId}'>here</a>`;
  buttons.mint.disabled = false;
};

buttons.mint.onclick = async () => {
  const sender = {
    addr: accountsMenu.selectedOptions[0].value,
    signer,
  };

  const winningProposalKey = (await daoApp.getGlobalState())
    .winning_proposal
    // @ts-ignore
    .valueRaw as Uint8Array;

  const proposalKey = new Uint8Array([
    ...new Uint8Array(Buffer.from('p-')),
    ...winningProposalKey,
  ]);

  // Fund dao so it can send innertxn
  await daoApp.fundAppAccount(algokit.algos(0.1));
  // Fund minter so it can create asset
  await minterApp.fundAppAccount(algokit.algos(0.2));

  const result = await daoApp.call({
    method: 'mint',
    sendParams: { fee: algokit.microAlgos(algosdk.ALGORAND_MIN_TX_FEE * 3) },
    methodArgs: {
      args: [minterAppId],
      boxes: [{ appIndex: 0, name: proposalKey }],
    },
    sender,
  });

  document.getElementById('status').innerHTML = `NFT minted! See the NFT <a href='https://app.dappflow.org/explorer/nft/${result.return.returnValue}/transactions'>here</a>`;
};
