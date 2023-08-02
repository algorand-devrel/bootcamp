/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { Web3Storage } from 'web3.storage'
import { DaoClient } from '../contracts/dao'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const PER_BOX_MBR = 0.0025e6
const PER_BYTE_MBR = 0.0004e6
/**
 * Proposal: [name, url, unitName, hash]
 */
type Proposal = [string, string, string, Uint8Array]

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
          await appClient.appClient.fundAppAccount(algokit.microAlgos(100_000))
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
        setLoading(true)
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

        const proposalID = 0
        const encodedProposalID = algosdk.encodeUint64(proposalID)

        // bytes = (size of key (uint64) + size of value (uint64) + size of prefix (2))
        const costVoteBox = PER_BOX_MBR + PER_BYTE_MBR * (8 + 8 + 2)

        // bytes = (size of key (uint64) + size of prefix (2) + size of encoded data structure)
        const tupleType = algosdk.ABIType.from('(string,string,string,byte[32])')
        const encodedTuple = tupleType.encode([props.name, url, props.unitName, hash] as Proposal)
        const costProposalBox = PER_BOX_MBR + PER_BYTE_MBR * (8 + 2 + encodedTuple.byteLength)

        await appClient.appClient.fundAppAccount(algokit.microAlgos(costVoteBox + costProposalBox))

        const proposalKey = new Uint8Array([...Buffer.from('p-'), ...encodedProposalID])
        const votesKey = new Uint8Array([...Buffer.from('v-'), ...encodedProposalID])
        await appClient.addProposal(
          {
            proposal: [props.name, url, props.unitName, hash] as Proposal,
          },
          { boxes: [proposalKey, votesKey] },
        )
        setLoading(false)
      }
      break
    case 'vote':
      text = 'Vote'
      callMethod = async () => {
        setLoading(true)

        const encodedProposalID = algosdk.encodeUint64(props.proposalID)
        const voteKey = new Uint8Array([...Buffer.from('v-'), ...encodedProposalID])
        await appClient.vote(
          {
            proposal_id: props.proposalID,
          },
          {
            boxes: [voteKey],
          },
        )
        setLoading(false)
      }
      break
    case 'mint':
      text = 'Mint'
      callMethod = async () => {
        setLoading(true)
        const encodedProposalID = algosdk.encodeUint64(0)
        const proposalKey = new Uint8Array([...Buffer.from('p-'), ...encodedProposalID])

        await appClient.appClient.fundAppAccount(algokit.microAlgos(100_000))
        await appClient.mint({}, { boxes: [proposalKey], sendParams: { fee: algokit.microAlgos(2_000) } })
        setLoading(false)
      }
      break
  }

  return (
    <button className={`btn m-2`} onClick={callMethod}>
      {loading ? <span className="loading loading-spinner" /> : text}
    </button>
  )
}

export default AppCalls
