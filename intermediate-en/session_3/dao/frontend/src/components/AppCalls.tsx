/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { Web3Storage } from 'web3.storage'
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
        if (props.file === undefined) {
          enqueueSnackbar('File is missing!', { variant: 'error' })
          throw Error('File is missing')
        }

        /*
        Generate ARC3 url and metadata hash based on the file
        props.file -> upload to IPFS -> get URL -> get hash
        Metadata.json:
          * decimals: 0
          * name: props.name
          * unitName: props.unitName
          * image: props.file uploaded to IPFS
          * image_mimetype: props.file.type
          * properties: {}
        URL:
          * use ipfs:// protocol
          * point to metadata.json
          * end with #arc3
        Hash:
          * sha256 of the metadata.json
        */
        const w3s = new Web3Storage({ token: props.web3StorageToken })

        const imageRoot = await w3s.put([props.file], { name: props.file.name })

        const metadata = {
          decimals: 0,
          name: props.name,
          unitName: props.unitName,
          image: `ipfs://${imageRoot}/${props.file.name}`,
          image_mimetype: props.file.type,
          properties: {},
        }

        const metadataJson = JSON.stringify(metadata)

        const metadataFile = new File([metadataJson], 'metadata.json', { type: 'text/plain' })

        const metadataRoot = await w3s.put([metadataFile], { name: 'metadata.json' })

        const msgBuffer = new TextEncoder().encode(metadataJson)

        const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', msgBuffer))

        const url = `ipfs://${metadataRoot}/metadata.json#arc3`

        console.log(url, hash)
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
