/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import algosdk, { ABIArgument } from 'algosdk'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AuctionState } from '../App'
import { AuctionClient } from '../contracts/auction'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

type Methods = 'create' | 'start' | 'bid' | 'claim_asset' | 'claim_bid'

const AppCalls = (props: {
  method: Methods
  setAuctionState: React.Dispatch<React.SetStateAction<AuctionState>>
  appID: number
  setAppID?: React.Dispatch<React.SetStateAction<number>>
}) => {
  const [loading, setLoading] = useState<boolean>(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  })

  const { enqueueSnackbar } = useSnackbar()
  const { signer, activeAddress } = useWallet()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sender = { signer, addr: activeAddress! }

  const appClient = new AuctionClient(
    {
      resolveBy: 'id',
      id: props.appID,
      sender,
    },
    algodClient,
  )

  const callMethods = {
    create: async () => {
      if (props.setAppID === undefined) throw Error('setAppID is undefined')

      setLoading(true)

      await appClient.create.bare().catch((e: Error) => {
        enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
        setLoading(false)
        return
      })

      const { appId } = await appClient.appClient.getAppReference()
      setLoading(false)

      props.setAppID(Number(appId))
    },
    start: async () => {
      // opt_into_asset and start_auction logic here
      setLoading(true)

      const assetIndex = (document.getElementById('asa') as HTMLInputElement).valueAsNumber
      const appAddress = algosdk.getApplicationAddress(props.appID)
      const suggestedParams = await algodClient.getTransactionParams().do()
      const atc = new algosdk.AtomicTransactionComposer()

      // opt_into_asset: Pay the application 0.2 ALGO
      // MBR === Minimum Balance Requirement
      // 0.1 ALGO for account MBR
      // 0.1 ALGO for ASA MBR
      const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAddress!,
        to: appAddress,
        amount: 200_000,
        suggestedParams,
      })

      // opt_into_asset: call opt_into_asset on the application
      atc.addMethodCall({
        method: appClient.appClient.getABIMethod('optin_to_asset')!,
        methodArgs: [{ txn: payment, signer }, assetIndex],
        suggestedParams: { ...suggestedParams, fee: 2_000, flatFee: true },
        sender: sender.addr,
        signer,
        appID: props.appID,
      })

      // start auction
      const startPrice = (document.getElementById('start') as HTMLInputElement).valueAsNumber
      const length = (document.getElementById('length') as HTMLInputElement).valueAsNumber

      const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: activeAddress!,
        to: appAddress,
        assetIndex,
        suggestedParams,
        amount: 1,
      })

      atc.addMethodCall({
        method: appClient.appClient.getABIMethod('start')!,
        methodArgs: [length, startPrice, { txn: axfer, signer }],
        suggestedParams,
        sender: sender.addr,
        signer,
        appID: props.appID,
      })

      try {
        await atc.execute(algodClient, 3)
        enqueueSnackbar(`Transaccion enviada con exito`, { variant: 'success' })
      } catch (e) {
        console.warn(e)
        enqueueSnackbar(`Error deploying the contract: ${(e as Error).message}`, { variant: 'error' })
        setLoading(false)
        return
      }

      setLoading(false)
      props.setAuctionState(AuctionState.Started)
    },
    bid: async () => {
      setLoading(true)

      const appAddress = algosdk.getApplicationAddress(props.appID)
      const suggestedParams = await algodClient.getTransactionParams().do()

      const bidPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAddress!,
        to: appAddress,
        amount: (document.getElementById('bid') as HTMLInputElement).valueAsNumber,
        suggestedParams,
      })

      const atc = new algosdk.AtomicTransactionComposer()

      const winner = (await appClient.getGlobalState()).winner
      const prev = (winner?.asString() == '' ? appAddress : winner?.asByteArray()) as ABIArgument

      atc.addMethodCall({
        method: appClient.appClient.getABIMethod('bid')!,
        methodArgs: [{ txn: bidPayment, signer }, prev],
        sender: sender.addr,
        signer,
        appID: props.appID,
        suggestedParams: { ...suggestedParams, fee: 2_000, flatFee: true },
      })

      try {
        await atc.execute(algodClient, 3)
        const hb = await (await appClient.getGlobalState()).highest_bid?.asNumber()
        enqueueSnackbar(`Transaccion enviada con exito, apuesta mayor actual: ${hb}`, { variant: 'success' })
      } catch (e) {
        console.warn(e)
        enqueueSnackbar(`Error deploying the contract: ${(e as Error).message}`, { variant: 'error' })
        setLoading(false)
        return
      }

      setLoading(false)
      // > Logica para verificar que haya finalizado la subasta y cambiar el estado a Ended
      // props.setAuctionState(AuctionState.Started)

    },
    claim_asset: async() => {

    },
    claim_bid: async() => {

    },
  }

  let text: string
  switch (props.method) {
    case 'create':
      text = 'Create App'
      break
    case 'start':
      text = 'Start Auction'
      break
    case 'bid':
      text = 'Bid'
      break
    case 'claim_asset':
      text = 'Claim Asset'
      break
    case 'claim_bid':
      text = 'Claim Bid'
      break
  }

  const callButton = (
    <button className={`btn m-2`} onClick={callMethods[props.method]}>
      {loading ? <span className="loading loading-spinner" /> : text}
    </button>
  )

  switch (props.method) {
    case 'create':
      return callButton
    case 'start':
      return (
        <div>
          <label htmlFor="asa" className="label m-2">
            Asset ID
          </label>
          <input type="number" id="asa" defaultValue="0" className="input input-bordered" />

          <label htmlFor="start" className="label m-2">
            Starting Price
          </label>
          <input type="number" id="start" defaultValue="0" className="input input-bordered" />
          <label htmlFor="length" className="label m-2">
            Length (Seconds)
          </label>
          <input type="number" id="length" defaultValue="0" className="input input-bordered" />
          <br />
          {callButton}
        </div>
      )
    case 'bid':
      return (
        <div>
          <label htmlFor="bid" className="label m-2">
            Bid Amount
          </label>
          <input type="number" id="bid" defaultValue="0" className="input input-bordered" />
          <br />
          {callButton}
        </div>
      )
    case 'claim_asset':
      return (
        <div>
          <label htmlFor="bid" className="label m-2">
            Claim Asset
          </label>
          <input type="number" id="bid" defaultValue="0" className="input input-bordered" />
          <br />
          {callButton}
        </div>
      )
    case 'claim_bid':
      return (
        <div>
          <label htmlFor="bid" className="label m-2">
            Claim Bid
          </label>
          <input type="number" id="bid" defaultValue="0" className="input input-bordered" />
          <br />
          {callButton}
        </div>
      )
  }
}

export default AppCalls
