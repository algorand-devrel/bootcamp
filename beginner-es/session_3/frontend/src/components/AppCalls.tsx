import * as algokit from '@algorandfoundation/algokit-utils'
import { AppDetails } from '@algorandfoundation/algokit-utils/types/app-client'
import { useWallet } from '@txnlab/use-wallet'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AuctionClient } from '../contracts/auction'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

type Methods = 'create' | 'start' | 'bid'

const AppCalls = (props: { method: Methods; appID: number; setAppID?: React.Dispatch<React.SetStateAction<number>> }) => {
  const [loading, setLoading] = useState<boolean>(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  })

  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const indexer = algokit.getAlgoIndexerClient({
    server: indexerConfig.server,
    port: indexerConfig.port,
    token: indexerConfig.token,
  })

  const { enqueueSnackbar } = useSnackbar()
  const { signer, activeAddress } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const appDetails = {
    resolveBy: 'id',
    id: props.appID,
    sender,
  } as AppDetails

  const appClient = new AuctionClient(appDetails, algodClient)
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
  }
}

export default AppCalls
