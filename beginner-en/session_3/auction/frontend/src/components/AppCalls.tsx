/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AuctionState } from '../App'
import { AuctionClient } from '../contracts/auction'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

type Methods = 'create' | 'start' | 'bid'

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

      setLoading(false)

      const { appId } = await appClient.appClient.getAppReference()
      props.setAppID(Number(appId))
    },
    start: async () => {
      if (activeAddress === undefined) throw Error('activeAddress is undefined')
      setLoading(true)

      const assetIndex = (document.getElementById('asa') as HTMLInputElement).valueAsNumber
      const appAddress = algosdk.getApplicationAddress(props.appID)

      const suggestedParams = await algodClient.getTransactionParams().do()

      const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: activeAddress,
        to: appAddress,
        amount: (document.getElementById('asa-amount') as HTMLInputElement).valueAsNumber,
        assetIndex,
        suggestedParams,
      })

      const mbrPayment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAddress,
        to: appAddress,
        amount: 200_000,
        suggestedParams,
      })

      const atc = new algosdk.AtomicTransactionComposer()

      atc.addTransaction({
        txn: mbrPayment,
        signer,
      })

      atc.addMethodCall({
        method: appClient.appClient.getABIMethod('opt_into_asset')!,
        suggestedParams: { ...(await algodClient.getTransactionParams().do()), fee: 2_000, flatFee: true },
        methodArgs: [assetIndex],
        sender: sender.addr,
        signer: signer,
        appID: props.appID,
      })

      atc.addMethodCall({
        method: appClient.appClient.getABIMethod('start_auction')!,
        suggestedParams: await algodClient.getTransactionParams().do(),
        methodArgs: [1, 1, { txn: axfer, signer }],
        sender: sender.addr,
        signer: signer,
        appID: props.appID,
      })

      try {
        await atc.execute(algodClient, 3)
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
      if (activeAddress === undefined) throw Error('activeAddress is undefined')
      setLoading(true)

      const appAddress = algosdk.getApplicationAddress(props.appID)

      const suggestedParams = await algodClient.getTransactionParams().do()

      const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAddress,
        to: appAddress,
        amount: (document.getElementById('bid') as HTMLInputElement).valueAsNumber,
        suggestedParams,
      })

      await appClient.bid({ payment })

      setLoading(false)
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
          <label htmlFor="asa-amount" className="label m-2">
            Asset Amount
          </label>
          <input type="number" id="asa-amount" defaultValue="0" className="input input-bordered" />
          <label htmlFor="start" className="label m-2">
            Start Amount
          </label>
          <input type="number" id="start" defaultValue="0" className="input input-bordered" />
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
  }
}

export default AppCalls
