import algosdk, { AtomicTransactionComposer } from 'algosdk'
import { PeraSession } from './wallets/pera'
import Utils from './utils'
import * as algokit from '@algorandfoundation/algokit-utils'
import appspec from '../application.json'

const pera = new PeraSession()
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
const indexerClient = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '')
const contract = new algosdk.ABIContract(appspec.contract)

let auctionAppId: number
let auctionApp: algokit.ApplicationClient

const accountsMenu = document.getElementById('accounts') as HTMLSelectElement
const amountInput = document.getElementById('amount') as HTMLInputElement
const asaInput = document.getElementById('asa') as HTMLInputElement
const asaAmountInput = document.getElementById('asa-amount') as HTMLInputElement
const buttonIds = ['create', 'connect', 'start', 'bid', 'claim-bid', 'claim-asset']
const buttons: { [key: string]: HTMLButtonElement } = {}
buttonIds.forEach(id => {
  buttons[id] = document.getElementById(id) as HTMLButtonElement
})

async function signer (txns: algosdk.Transaction[]) {
  return await pera.signTxns(txns)
}

buttons.connect.onclick = async () => {
  await pera.getAccounts()
  buttons.create.disabled = false
  pera.accounts.forEach(account => {
    accountsMenu.add(new Option(account, account))
  })
}

buttons.create.onclick = async () => {
  document.getElementById('status').innerHTML = 'Creating auction app...'
  const sender = {
    addr: accountsMenu.selectedOptions[0].value,
    signer
  }

  auctionApp = new algokit.ApplicationClient(
    {
      app: JSON.stringify(appspec),
      sender,
      creatorAddress: sender.addr
    },
    algodClient,
    indexerClient
  )

  const { appIndex, appAddress, transaction } = await auctionApp.create()

  auctionAppId = appIndex

  document.getElementById('status').innerHTML = `App created with id ${appIndex} and address ${appAddress} in tx ${transaction.txID()}. See it <a href='https://testnet.algoscan.app/app/${appIndex}'>here</a>`
  buttons.start.disabled = false
  buttons.create.disabled = true
}

buttons.start.onclick = async () => {
  document.getElementById('status').innerHTML = 'Starting auction...'
  const sender = accountsMenu.selectedOptions[0].value

  const atc = new algosdk.AtomicTransactionComposer()
  const asa = asaInput.valueAsNumber
  const suggestedParams = await algodClient.getTransactionParams().do()

  // Fund app
  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: 200_000,
    from: sender,
    to: algosdk.getApplicationAddress(auctionAppId)
  })
  atc.addTransaction({ txn: payment, signer })

  // Opt app into ASA
  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: algosdk.getMethodByName(contract.methods, 'opt_into_asset'),
      sender,
      signer,
      suggestedParams: { ...suggestedParams, fee: 2_000, flatFee: true },
      methodArgs: [asa]
    })

  const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: sender,
    amount: asaAmountInput.valueAsNumber,
    to: algosdk.getApplicationAddress(auctionAppId),
    assetIndex: asa
  })

  // Start auction
  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: algosdk.getMethodByName(contract.methods, 'start_auction'),
      sender,
      signer,
      suggestedParams: await algodClient.getTransactionParams().do(),
      methodArgs: [amountInput.valueAsNumber, 36_000, { txn: axfer, signer }]
    })

  await atc.execute(algodClient, 3)

  document.getElementById('status').innerHTML = `Auction started! See the app <a href='https://testnet.algoscan.app/app/${auctionAppId}'>here</a>`

  buttons.bid.disabled = false
  buttons.start.disabled = true
}

buttons.bid.onclick = async () => {
  document.getElementById('status').innerHTML = 'Sending bid...'
  const sender = {
    addr: accountsMenu.selectedOptions[0].value,
    signer
  }

  const suggestedParams = await algodClient.getTransactionParams().do()
  suggestedParams.fee = 2_000
  suggestedParams.flatFee = true

  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: amountInput.valueAsNumber,
    from: sender.addr,
    to: algosdk.getApplicationAddress(auctionAppId)
  })

  const state = (await algodClient.getApplicationByID(auctionAppId).do()).params['global-state']
  const readableState = Utils.getReadableState(state)
  const prevBidder = readableState.highest_bidder.address || sender.addr

  const atc = new AtomicTransactionComposer()
  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: algosdk.getMethodByName(contract.methods, 'bid'),
      methodArgs: [{ txn: payment, signer }, prevBidder],
      signer,
      sender: sender.addr,
      suggestedParams
    }
  )

  await atc.execute(algodClient, 3)

  document.getElementById('status').innerHTML = `Bid sent! See the app <a href='https://testnet.algoscan.app/app/${auctionAppId}'>here</a>`
}

buttons['claim-bid'].onclick = async () => {
  const suggestedParams = await algodClient.getTransactionParams().do()
  suggestedParams.fee = 2_000
  suggestedParams.flatFee = true

  const atc = new algosdk.AtomicTransactionComposer()

  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: algosdk.getMethodByName(contract.methods, 'claim_bid'),
      sender: accountsMenu.selectedOptions[0].value,
      signer,
      suggestedParams
    }
  )

  atc.execute(algodClient, 3)
}

buttons['claim-asset'].onclick = async () => {
  const suggestedParams = await algodClient.getTransactionParams().do()
  suggestedParams.fee = 2_000
  suggestedParams.flatFee = true

  const atc = new algosdk.AtomicTransactionComposer()

  const asa = asaInput.valueAsNumber
  const asaCreator = (await algodClient.getAssetByID(asa).do()).params.creator
  atc.addMethodCall(
    {
      appID: auctionAppId,
      methodArgs: [asa, asaCreator],
      method: algosdk.getMethodByName(contract.methods, 'claim_asset'),
      sender: accountsMenu.selectedOptions[0].value,
      signer,
      suggestedParams
    }
  )

  atc.execute(algodClient, 3)
}
