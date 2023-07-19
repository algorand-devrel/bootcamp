import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { AppDetails } from '@algorandfoundation/algokit-utils/types/app-client'
import { useWallet } from '@txnlab/use-wallet'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AuctionState } from '../App'
import { AuctionClient } from '../contracts/auction'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const AppCalls = (props: {
  method: 'create'
  setAuctionState: React.Dispatch<React.SetStateAction<AuctionState>>
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

  const create = async () => {
    if (props.setAppID === undefined) throw Error('setAppID is undefined')

    setLoading(true)

    const appDetails = {
      resolveBy: 'id',
      id: 0,
      sender: { signer, addr: activeAddress } as TransactionSignerAccount,
    } as AppDetails

    const appClient = new AuctionClient(appDetails, algodClient)

    await appClient.create.bare().catch((e: Error) => {
      enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    })

    setLoading(false)

    props.setAuctionState(AuctionState.Created)
    const { appId } = await appClient.appClient.getAppReference()
    props.setAppID(Number(appId))
  }

  switch (props.method) {
    case 'create':
      return (
        <button className={`btn m-2`} onClick={create}>
          {loading ? <span className="loading loading-spinner" /> : 'Create Application'}
        </button>
      )
  }
}

export default AppCalls
