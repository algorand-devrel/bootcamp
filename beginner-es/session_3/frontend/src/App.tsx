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
  const [appID, setAppID] = useState<number>(0)

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment()

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
              <p className="py-6">
                This starter has been generated using official AlgoKit React template. Refer to the resource below for next steps.
              </p>

              <div className="grid">
                <a
                  data-test-id="getting-started"
                  className="btn btn-primary m-2"
                  target="_blank"
                  href="https://github.com/algorandfoundation/algokit-cli"
                >
                  Getting started
                </a>

                <label htmlFor="app" className="label m-2">
                  App ID
                </label>
                <input
                  type="number"
                  id="app"
                  value={appID}
                  className="input input-bordered"
                  readOnly={true}
                  onChange={(e) => (e.target.valueAsNumber ? setAppID(e.target.valueAsNumber) : setAppID(0))}
                />

                <div className="divider" />
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
                  Wallet Connection
                </button>
                {activeAddress && appID === 0 && <AppCalls appID={appID} method="create" setAppID={setAppID} />}
              </div>

              <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
            </div>
          </div>
        </div>
      </WalletProvider>
    </SnackbarProvider>
  )
}
