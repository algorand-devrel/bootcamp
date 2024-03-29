/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { Web3Storage } from 'web3.storage'
import { MinterClient } from '../contracts/Minter'
import { DaoClient } from '../contracts/dao'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const PER_BOX_MBR = 0.0025e6
const PER_BYTE_MBR = 0.0004e6
/**
 * Proposal: [name, url, unitName, hash]
 */
type ProposalTuple = [string, string, string, Uint8Array]

type AppCallProps = {
  appID: number
} & (
  | {
      method: 'create'
      setAppID: React.Dispatch<React.SetStateAction<number>>
      setMinterAppID: React.Dispatch<React.SetStateAction<number>>
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
      setAssetID: React.Dispatch<React.SetStateAction<number>>
      minterAppID: number
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

  const daoClient = new DaoClient(
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
          const minterClient = new MinterClient(
            {
              resolveBy: 'id',
              id: 0,
              sender,
            },
            algodClient,
          )

          await minterClient.create.bare()
          const minter_app_id = (await minterClient.appClient.getAppReference()).appId
          await daoClient.create.create({ minter_app_id })
          await daoClient.appClient.fundAppAccount(algokit.microAlgos(100_000))
          props.setMinterAppID(Number(minter_app_id))
        } catch (e) {
          enqueueSnackbar(`Error deploying the contract: ${(e as Error).message}`, { variant: 'error' })
          setLoading(false)
          return
        }

        const { appId } = await daoClient.appClient.getAppReference()
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

        // bytes = (size of key (uint64) + size of value (uint64) + size of prefix (2))
        const costVoteBox = PER_BOX_MBR + PER_BYTE_MBR * (8 + 8 + 2)

        // bytes = (size of key (uint64) + size of prefix (2) + size of encoded data structure)
        const tupleType = algosdk.ABIType.from('(string,string,string,byte[32])')
        const encodedTuple = tupleType.encode([props.name, url, props.unitName, hash] as ProposalTuple)
        const costProposalBox = PER_BOX_MBR + PER_BYTE_MBR * (8 + 2 + encodedTuple.byteLength)

        await daoClient.appClient.fundAppAccount(algokit.microAlgos(costVoteBox + costProposalBox))

        // Get the current proposal ID from our app
        // Read the proposal ID from the global state
        const proposalID = (await daoClient.getGlobalState()).current_proposal_id!.asBigInt()
        const encodedProposalID = algosdk.encodeUint64(proposalID)

        const proposalKey = new Uint8Array([...Buffer.from('p-'), ...encodedProposalID])
        const votesKey = new Uint8Array([...Buffer.from('v-'), ...encodedProposalID])
        await daoClient.addProposal(
          {
            proposal: [props.name, url, props.unitName, hash] as ProposalTuple,
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

        const winningProposalID = (await daoClient.getGlobalState()).winning_proposal!.asBigInt()
        const encodedWinningProposalID = algosdk.encodeUint64(winningProposalID)
        const winningProposalVoteKey = new Uint8Array([...Buffer.from('v-'), ...encodedWinningProposalID])

        await daoClient.vote(
          {
            proposal_id: props.proposalID,
          },
          {
            boxes: [voteKey, winningProposalVoteKey],
          },
        )
        setLoading(false)
      }
      break
    case 'mint':
      text = 'Mint'
      callMethod = async () => {
        setLoading(true)
        const encodedProposalID = algosdk.encodeUint64((await daoClient.getGlobalState()).winning_proposal!.asBigInt())
        const proposalKey = new Uint8Array([...Buffer.from('p-'), ...encodedProposalID])
        const minterClient = new MinterClient(
          {
            resolveBy: 'id',
            id: props.minterAppID,
            sender,
          },
          algodClient,
        )

        await minterClient.appClient.fundAppAccount(algokit.microAlgos(200_000))
        const result = await daoClient.mint(
          { minter_app_ref: props.minterAppID },
          { boxes: [proposalKey], sendParams: { fee: algokit.microAlgos(3_000) } },
        )
        const assetID = result.return?.valueOf()
        props.setAssetID(Number(assetID))
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
