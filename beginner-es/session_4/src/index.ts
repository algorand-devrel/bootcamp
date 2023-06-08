import { PeraWalletConnect } from '@perawallet/connect'

// PASO 1: Conexion a Pera Wallet
const peraWallet = new PeraWalletConnect();
let accounts: string[] = []

const connectBtn = document.getElementById("connect") as HTMLButtonElement
const accountsList = document.getElementById('accounts') as HTMLSelectElement
const createBtn = document.getElementById("create") as HTMLButtonElement

connectBtn.onclick = async() => {
  accounts = await peraWallet.connect()
  connectBtn.disabled = true
  createBtn.disabled = false
  accounts.forEach(acc => {
    accountsList.add(new Option(acc, acc))
  })
}

// PASO 2: Creacion de app

import algosdk, { AtomicTransactionComposer, AtomicTransactionComposerStatus } from 'algosdk'
import * as algokit from '@algorandfoundation/algokit-utils'
import { ApplicationClient } from '@algorandfoundation/algokit-utils/types/app-client';
import appspec from '../application.json'


const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
const indexerClient = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '')

let auctionApp: ApplicationClient
let auctionAppId: number

const signTxns = async(unsignedTxns: Array<algosdk.Transaction>) => {
  const signerTransactions = unsignedTxns.map(txn => {
    return {
      txn,
      signers: [algosdk.encodeAddress(txn.from.publicKey)]
    }
  })
  return await peraWallet.signTransaction([signerTransactions])
}

async function signer(txns: algosdk.Transaction[]) {
  return signTxns(txns);
}

createBtn.onclick = async() => {
  document.getElementById("status").innerHTML = "Creando app..."
  const sender = {
    addr: accountsList.selectedOptions[0].value,
    signer
  }

  auctionApp = algokit.getAppClient(
    {
      app: JSON.stringify(appspec),
      sender,
      creatorAddress: sender.addr,
      indexer: indexerClient,
      id: 0
    },
    algodClient
  )

  await auctionApp.create()
  console.log((await auctionApp.getAppReference()).appAddress)
  auctionAppId = (await auctionApp.getAppReference()).appId;
  document.getElementById('status').innerHTML = `Subasta creada con ID ${auctionAppId} `
  createBtn.disabled = true
}

// PASO 3: Iniciar subasta
const startBtn = document.getElementById('start') as HTMLButtonElement
const contract = new algosdk.ABIContract(appspec.contract)

startBtn.onclick = async() => {
  document.getElementById("status").innerHTML = "Iniciando subasta..."

  const sender = accountsList.selectedOptions[0].value
  const atc = new algosdk.AtomicTransactionComposer()
  
  const suggestedParams = await algodClient.getTransactionParams().do()

  // Fondear aplicación
  const paytxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: 200_000,
    from: sender,
    to: algosdk.getApplicationAddress(auctionAppId)
  })
  atc.addTransaction({ 
    txn: paytxn, 
    signer 
  })

  // Llamar metodo de opt_in
  const asaInput = document.getElementById("asa") as HTMLInputElement
  const asa = asaInput.valueAsNumber

  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: algosdk.getMethodByName(contract.methods, 'opt_in'),
      sender,
      signer,
      suggestedParams: { ...suggestedParams, fee: 2_000, flatFee: true },
      methodArgs: [asa]
    })

  // Preparar txn de transferencia de asset
  const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: sender,
    amount: 1,
    to: algosdk.getApplicationAddress(auctionAppId),
    assetIndex: asa
  })

  // Llamada de metodo iniciar subasta
  const startAmountInput = document.getElementById("startAmount") as HTMLInputElement
  const startAmount = startAmountInput.valueAsNumber

  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: algosdk.getMethodByName(contract.methods, 'start_auction'),
      sender,
      signer,
      suggestedParams: await algodClient.getTransactionParams().do(),
      methodArgs: [300, startAmount, { txn: axfer, signer }]
    })
  await atc.execute(algodClient, 3)
  document.getElementById('status').innerHTML = `Subasta iniciada con éxito!`
  startBtn.disabled = true
}

// PASO 4: Hacer oferta
const bidBtn = document.getElementById("bid") as HTMLButtonElement
const bidAmount = document.getElementById("bidAmount") as HTMLInputElement

bidBtn.onclick = async() => {
  const sender = accountsList.selectedOptions[0].value

  // crear txn de pago para insertarla en la llamada
  const suggestedParams = await algodClient.getTransactionParams().do()
  
  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams: { ...suggestedParams, fee: 2_000, flatFee: true },
    from: sender,
    to: algosdk.getApplicationAddress(auctionAppId),
    amount: bidAmount.valueAsNumber
  })

  // Obtener el global state del previo ganador

  let prevBidder: string

  const appInfo = await algodClient.getApplicationByID(auctionAppId).do();
  const globalState = appInfo.params['global-state'] as {key: string, value: {bytes: string, type: number, uint: number}}[];
  await globalState.forEach(state => {
    const key = Buffer.from(state.key, 'base64').toString();
    const binaryBytes = Buffer.from(state.value.bytes, 'base64');
    if (key == "highest_bidder") {
      prevBidder = algosdk.encodeAddress(binaryBytes)=="Z3YJM6Q=" ? algosdk.getApplicationAddress(auctionAppId) : algosdk.encodeAddress(binaryBytes)
    }
  })

  const atc = new AtomicTransactionComposer()
  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: algosdk.getMethodByName(contract.methods, 'bid'),
      methodArgs: [{ txn: payment, signer }, prevBidder],
      signer,
      sender: sender,
      suggestedParams
    }
  )
  await atc.execute(algodClient, 3)

  document.getElementById('status').innerHTML = `Oferta enviada! <a href='https://app.dappflow.org/explorer/application/${auctionAppId}/transactions'>VER DETALLE</a>`

}

// PASO 5: Reclamar asset
const claimBtn = document.getElementById("claim") as HTMLButtonElement

claimBtn.onclick = async() => {
  const suggestedParams = await algodClient.getTransactionParams().do()

  const atc = new algosdk.AtomicTransactionComposer()

  const asaInput = document.getElementById("asa") as HTMLInputElement
  const asa = asaInput.valueAsNumber
  
  atc.addMethodCall(
    {
      appID: auctionAppId,
      methodArgs: [asa],
      method: algosdk.getMethodByName(contract.methods, 'claim_asset'),
      sender: accountsList.selectedOptions[0].value,
      signer,
      suggestedParams
    }
  )

  atc.execute(algodClient, 3)
}

