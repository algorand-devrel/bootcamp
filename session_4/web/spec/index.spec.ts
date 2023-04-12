import { describe, expect, beforeAll, it } from '@jest/globals'
import { Auction } from '../src/beaker/auction_client'
import * as bkr from 'beaker-ts'
import algosdk from 'algosdk'
import { SandboxAccount } from 'beaker-ts/lib/sandbox/accounts'

let creator: SandboxAccount
let appId: number
let accounts: SandboxAccount[]
let auctionApp: Auction
let firstBidder: SandboxAccount
let secondBidder: SandboxAccount

async function getAccounts () {
  accounts = await bkr.sandbox.getAccounts()
}

async function createAuction () {
  creator = accounts[0] as SandboxAccount

  auctionApp = new Auction({
    client: bkr.clients.sandboxAlgod(),
    signer: creator.signer,
    sender: creator.addr
  })

  appId = (await auctionApp.create()).appId
}

async function startAuction () {
  auctionApp = new Auction({
    client: bkr.clients.sandboxAlgod(),
    signer: creator.signer,
    sender: creator.addr,
    appId
  })

  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams: await bkr.clients.sandboxAlgod().getTransactionParams().do(),
    amount: 100_000,
    from: creator.addr,
    to: algosdk.getApplicationAddress(appId)
  })

  await auctionApp.start_auction({
    payment,
    starting_price: BigInt(10_000),
    length: BigInt(36_000)
  })
}

async function sendBid (amount: number, bidder: SandboxAccount) {
  const auctionApp = new Auction({
    client: bkr.clients.sandboxAlgod(),
    signer: bidder.signer,
    sender: bidder.addr,
    appId
  })

  const sp = await bkr.clients.sandboxAlgod().getTransactionParams().do()
  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams: { ...sp, fee: 2_000, flatFee: true },
    amount,
    from: bidder.addr,
    to: algosdk.getApplicationAddress(appId)
  })

  await auctionApp.bid({
    payment,
    previous_bidder: firstBidder.addr
  }
  )
}

describe('Auction App Creation', () => {
  let state: any
  let rawState: any

  beforeAll(async () => {
    await getAccounts()
    await createAuction()
    state = await auctionApp.getApplicationState()
    rawState = await auctionApp.getApplicationState(true)
  })

  it('owner == Txn.sender', async () => {
    expect(algosdk.encodeAddress(rawState['6f776e6572'] as Uint8Array)).toBe(creator.addr)
  })

  it('auction_end == 0', () => {
    expect(state.auction_end).toBe(0)
  })

  it('highest_bid == 0', () => {
    expect(state.highest_bid).toBe(0)
  })

  it('highest_bidder == ""', () => {
    expect(state.highest_bidder).toBe('')
  })
})

describe('Auction Start', () => {
  let state: any

  beforeAll(async () => {
    await getAccounts()
    await createAuction()
    await startAuction()
    state = await auctionApp.getApplicationState()
  })

  it('auction_end > 0', () => {
    expect(state.auction_end).toBeGreaterThan(0)
  })

  it('highest_bid == 10_000', () => {
    expect(state.highest_bid).toBe(10_000)
  })
})

describe('First Bid', () => {
  let state: any
  let rawState: any

  beforeAll(async () => {
    await getAccounts()
    await createAuction()
    await startAuction()
    firstBidder = accounts[1] as SandboxAccount
    await sendBid(20_000, firstBidder)

    state = await auctionApp.getApplicationState()
    rawState = await auctionApp.getApplicationState(true)
  })

  it('highest_bid == 20_000', () => {
    expect(state.highest_bid).toBe(20_000)
  })

  it('highest_bidder == Txn.sender', () => {
    expect(algosdk.encodeAddress(rawState['686967686573745f626964646572'] as Uint8Array)).toBe(firstBidder.addr)
  })
})

describe('Second Bid', () => {
  let state: any
  let rawState: any

  beforeAll(async () => {
    await getAccounts()
    await createAuction()
    await startAuction()
    firstBidder = accounts[1] as SandboxAccount
    await sendBid(20_000, firstBidder)
    secondBidder = accounts[2] as SandboxAccount
    await sendBid(30_000, secondBidder)

    state = await auctionApp.getApplicationState()
    rawState = await auctionApp.getApplicationState(true)
  })

  it('highest_bid == 30_000', () => {
    expect(state.highest_bid).toBe(30_000)
  })

  it('highest_bidder == Txn.sender', () => {
    expect(algosdk.encodeAddress(rawState['686967686573745f626964646572'] as Uint8Array)).toBe(secondBidder.addr)
  })
})
