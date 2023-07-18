/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as algokit from '@algorandfoundation/algokit-utils'
import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'
import { PeraWalletConnect } from '@perawallet/connect'
import { PROVIDER_ID, ProvidersArray, WalletProvider, useInitializeProviders, useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { SnackbarProvider } from 'notistack'
import { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { AuctionClient } from './contracts/auction'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
enum AuctionState {
  Pending,
  Created,
  Started,
  Ended,
}

let providersArray: ProvidersArray
if (import.meta.env.VITE_ALGOD_NETWORK === '') {
  providersArray = [{ id: PROVIDER_ID.KMD }]
} else {
  providersArray = [
    { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
    { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
    { id: PROVIDER_ID.DAFFI, clientStatic: DaffiWalletConnect },
    { id: PROVIDER_ID.EXODUS },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const { signer, activeAddress } = useWallet()
  const [auctionState, setAuctionState] = useState<AuctionState>(AuctionState.Pending)
  const [appID, setAppID] = useState<number>(0)

  const algodConfig = getAlgodConfigFromViteEnvironment()

  const auctionClient: AuctionClient = new AuctionClient(
    {
      resolveBy: 'id',
      id: 0,
      sender: { signer, addr: activeAddress! },
    },
    algokit.getAlgoClient(algodConfig),
  )

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const createApp = async () => {
    const res = await auctionClient!.create.bare()
    setAppID(res.transactions[0].appIndex)
    setAuctionState(AuctionState.Created)
  }

  const startAuction = () => {
    setAuctionState(AuctionState.Started)
  }

  const walletProviders = useInitializeProviders({
    providers: providersArray,
    nodeConfig: {
      network: algodConfig.network,
      nodeServer: algodConfig.server,
      nodePort: String(algodConfig.port),
      nodeToken: String(algodConfig.token),
    },
    algosdkStatic: algosdk,
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider value={walletProviders}>
        <div className="hero min-h-screen bg-teal-400">
          <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
            <div className="max-w-md">
              <h1 className="text-4xl">
                Welcome to <div className="font-bold">AlgoKit 🙂</div>
              </h1>
              <p className="py-6">This is the auction app interface for the beginner bootcamp!</p>

              <div className="grid">
                <p>
                  App ID:{' '}
                  {auctionState === AuctionState.Pending ? (
                    'None'
                  ) : (
                    <a href={`https://dappflow.org/explorer/application/12174882${appID}`}>{appID}</a>
                  )}{' '}
                </p>

                <div className="divider" />
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
                  Wallet Connection
                </button>

                {activeAddress && auctionState === AuctionState.Pending && (
                  <button className="btn m-2" onClick={createApp}>
                    Create App
                  </button>
                )}

                {activeAddress && auctionState === AuctionState.Created && (
                  <label htmlFor="asa" className="label m-2">
                    Asset ID
                  </label>
                )}
                {activeAddress && auctionState === AuctionState.Created && (
                  <input type="number" id="asa" value="0" className="input input-bordered" />
                )}

                {activeAddress && auctionState === AuctionState.Created && (
                  <label htmlFor="asa-amount" className="label m-2">
                    Asset Amount
                  </label>
                )}
                {activeAddress && auctionState === AuctionState.Created && (
                  <input type="number" id="asa-amount" value="0" className="input input-bordered" />
                )}

                {activeAddress && auctionState === AuctionState.Created && (
                  <label htmlFor="start" className="label m-2">
                    Start Amount
                  </label>
                )}
                {activeAddress && auctionState === AuctionState.Created && (
                  <input type="number" id="start" value="0" className="input input-bordered" />
                )}

                {activeAddress && auctionState === AuctionState.Created && (
                  <button className="btn m-2" onClick={startAuction}>
                    Start Auction
                  </button>
                )}

                {activeAddress && auctionState === AuctionState.Started && (
                  <label htmlFor="bid" className="label m-2">
                    Bid Amount
                  </label>
                )}
                {activeAddress && auctionState === AuctionState.Started && (
                  <input type="number" id="bid" value="0" className="input input-bordered" />
                )}

                {activeAddress && auctionState === AuctionState.Started && <button className="btn m-2">Bid</button>}

                <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
              </div>
            </div>
          </div>
        </div>
      </WalletProvider>
    </SnackbarProvider>
  )
}
