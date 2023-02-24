import algosdk, { AtomicTransactionComposer } from 'algosdk'
import { Auction } from './beaker/auction_client'
import { MyAlgoSession } from './wallets/myalgo'
import { Utils } from './utils'

const myAlgo = new MyAlgoSession()
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
let auctionAppId: number

const accountsMenu = document.getElementById('accounts') as HTMLSelectElement
const amountInput = document.getElementById('amount') as HTMLInputElement
const asaInput = document.getElementById('asa') as HTMLInputElement
const asaAmountInput = document.getElementById('asa-amount') as HTMLInputElement
const buttonIds = ['create', 'connect', 'start', 'bid']
const buttons: { [key: string]: HTMLButtonElement } = {}
buttonIds.forEach(id => {
  buttons[id] = document.getElementById(id) as HTMLButtonElement
})

async function signer (txns: algosdk.Transaction[]) {
  const sTxns = await myAlgo.signTxns(txns)
  return sTxns.map(s => s.blob)
}

buttons.connect.onclick = async () => {
  await myAlgo.getAccounts()
  buttons.create.disabled = false
  myAlgo.accounts.forEach(account => {
    accountsMenu.add(new Option(`${account.name} - ${account.address}`, account.address))
  })
}

buttons.create.onclick = async () => {
  document.getElementById('status').innerHTML = 'Creating auction app...'
  const sender = accountsMenu.selectedOptions[0].value

  const auctionApp = new Auction({
    client: algodClient,
    signer,
    sender
  })

  const { appId, appAddress, txId } = await auctionApp.create()
  auctionAppId = appId

  document.getElementById('status').innerHTML = `App created with id ${appId} and address ${appAddress} in tx ${txId}. See it <a href='https://testnet.algoexplorer.io/application/${appId}'>here</a>`
  buttons.start.disabled = false
  buttons.create.disabled = true
}

buttons.start.onclick = async () => {
  document.getElementById('status').innerHTML = 'Starting auction...'
  const sender = accountsMenu.selectedOptions[0].value

  const auctionApp = new Auction({
    sender,
    signer,
    client: algodClient,
    appId: auctionAppId
  })

  const atc = new AtomicTransactionComposer()
  const suggestedParams = await algodClient.getTransactionParams().do()

  // Funding app with MBR (.1 for account, .1 for ASA)
  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: 200_000,
    from: sender,
    to: algosdk.getApplicationAddress(auctionAppId)
  })
  atc.addTransaction({ txn: payment, signer })

  const asa = asaInput.valueAsNumber

  // Opt app into ASA
  atc.addMethodCall({
    appID: auctionAppId,
    method: algosdk.getMethodByName(auctionApp.methods, 'opt_into_asset'),
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

  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: algosdk.getMethodByName(auctionApp.methods, 'start_auction'),
      sender,
      signer,
      suggestedParams,
      methodArgs: [amountInput.valueAsNumber, 36_000, { txn: axfer, signer }]
    }
  )

  await atc.execute(algodClient, 3)

  document.getElementById('status').innerHTML = `Auction started! See the app <a href='https://testnet.algoexplorer.io/application/${auctionAppId}'>here</a>`

  buttons.bid.disabled = false
  buttons.start.disabled = true
}

buttons.bid.onclick = async () => {
  document.getElementById('status').innerHTML = 'Sending bid...'
  const sender = accountsMenu.selectedOptions[0].value

  const auctionApp = new Auction({
    sender,
    signer,
    client: algodClient,
    appId: auctionAppId
  })

  const suggestedParams = await algodClient.getTransactionParams().do()

  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: amountInput.valueAsNumber,
    from: sender,
    to: algosdk.getApplicationAddress(auctionAppId)
  })

  const state = (await algodClient.getApplicationByID(auctionAppId).do()).params['global-state']
  const readableState = Utils.getReadableState(state)
  const prevBidder = readableState.highest_bidder.address || sender

  let bidSuggestedParams = { ...suggestedParams }
  if (readableState.highest_bidder.address) bidSuggestedParams = { ...suggestedParams, fee: 2_000, flatFee: true }

  await auctionApp.bid({
    payment,
    previous_bidder: prevBidder
  },
  {
    suggestedParams: bidSuggestedParams
  })

  document.getElementById('status').innerHTML = `Bid sent! See the app <a href='https://testnet.algoexplorer.io/application/${auctionAppId}'>here</a>`
}
