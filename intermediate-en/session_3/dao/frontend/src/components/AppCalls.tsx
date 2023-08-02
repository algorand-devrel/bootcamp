/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { DaoClient } from '../contracts/dao'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

type AppCallProps = {
  appID: number
} & (
  | {
      method: 'create'
      setAppID: React.Dispatch<React.SetStateAction<number>>
    }
  | {
      method: 'add_proposal'
      name: string
      unitName: string
      file: File | undefined
      web3StorageToken: string
    }
  | {
      method: 'vote'
      proposalID: number
    }
  | {
      method: 'mint'
    }
)

const AppCalls = (props: AppCallProps) => {
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

  const appClient = new DaoClient(
    {
      resolveBy: 'id',
      id: props.appID,
      sender,
    },
    algodClient,
  )

  let text: string
  let callMethod: () => Promise<void>
  switch (props.method) {
    case 'create':
      text = 'Create App'
      callMethod = async () => {
        setLoading(true)

        try {
          await appClient.create.bare()
        } catch (e) {
          enqueueSnackbar(`Error deploying the contract: ${(e as Error).message}`, { variant: 'error' })
          setLoading(false)
          return
        }

        const { appId } = await appClient.appClient.getAppReference()
        setLoading(false)

        props.setAppID(Number(appId))
      }
      break
    case 'add_proposal':
      text = 'Propose'
      callMethod = async () => {
        if (props.file === undefined) enqueueSnackbar('File is missing!', { variant: 'error' })
      }
      break
    case 'vote':
      text = 'Vote'
      callMethod = async () => {}
      break
    case 'mint':
      text = 'Mint'
      callMethod = async () => {}
      break
  }

  return (
    <button className={`btn m-2`} onClick={callMethod}>
      {loading ? <span className="loading loading-spinner" /> : text}
    </button>
  )
}

export default AppCalls
