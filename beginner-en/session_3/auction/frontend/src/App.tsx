/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'
import { PeraWalletConnect } from '@perawallet/connect'
import { PROVIDER_ID, ProvidersArray, WalletProvider, useInitializeProviders, useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { SnackbarProvider } from 'notistack'
import { useState } from 'react'
import AppCalls from './components/AppCalls'
import ConnectWallet from './components/ConnectWallet'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

export enum AuctionState {
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
  const { activeAddress } = useWallet()
  const [auctionState, setAuctionState] = useState<AuctionState>(AuctionState.Pending)
  const [appID, setAppID] = useState<number>(0)

  const algodConfig = getAlgodConfigFromViteEnvironment()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
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
                  App ID:
                  {auctionState === AuctionState.Pending ? (
                    'None'
                  ) : (
                    <a href={`https://app.dappflow.org/explorer/application/${appID}`}>{appID}</a>
                  )}
                </p>

                <div className="divider" />
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
                  Wallet Connection
                </button>

                {activeAddress && auctionState === AuctionState.Pending && (
                  <AppCalls method="create" setAuctionState={setAuctionState} setAppID={setAppID} />
                )}

                {activeAddress && auctionState === AuctionState.Created && <AppCalls method="start" setAuctionState={setAuctionState} />}

                {activeAddress && auctionState === AuctionState.Started && <AppCalls method="bid" setAuctionState={setAuctionState} />}
                <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
              </div>
            </div>
          </div>
        </div>
      </WalletProvider>
    </SnackbarProvider>
  )
}
