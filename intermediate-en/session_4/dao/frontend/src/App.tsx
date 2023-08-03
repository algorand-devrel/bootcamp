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
  const [assetID, setAssetID] = useState<number>(0)
  const [nftName, setNftName] = useState<string>('DAO NFT')
  const [unitName, setUnitName] = useState<string>('DNFT')
  const [fileUpload, setFileUpload] = useState<File | undefined>(undefined)
  const [voteProposalID, setVoteProposalID] = useState<number>(0)
  const [web3StorageToken, setWeb3StorageToken] = useState<string>('')
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
              <h1 className="text-4xl">NFT Minting DAO</h1>
              <p className="py-6">This is the DAO app interface for the intermediate bootcamp!</p>

              <div className="grid">
                <label className="label m-2">
                  App ID
                  <input
                    type="number"
                    value={appID}
                    className="input input-bordered"
                    readOnly={true}
                    onChange={(e) => (e.target.valueAsNumber ? setAppID(e.target.valueAsNumber) : setAppID(0))}
                  />
                </label>

                <div className="divider" />
                <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
                  Wallet Connection
                </button>

                {activeAddress && appID == 0 && <AppCalls appID={appID} method="create" setAppID={setAppID} />}

                {activeAddress && appID !== 0 && (
                  <div>
                    <div className="divider" />
                    <label className="label m-2">
                      Name
                      <input
                        defaultValue="DAO NFT"
                        className="input input-bordered"
                        onInput={(e) => {
                          setNftName((e.target as HTMLInputElement).value)
                        }}
                      />
                    </label>

                    <label className="label m-2">
                      Unit Name
                      <input
                        defaultValue="DNFT"
                        className="input input-bordered"
                        onInput={(e) => {
                          setUnitName((e.target as HTMLInputElement).value)
                        }}
                      />
                    </label>

                    <label className="label m-2">
                      web3.storage Token
                      <input
                        defaultValue="API TOKEN"
                        className="input input-bordered"
                        onInput={(e) => {
                          setWeb3StorageToken((e.target as HTMLInputElement).value)
                        }}
                      />
                    </label>

                    <label className="label m-2">
                      Image
                      <input
                        type="file"
                        className="file-input file-input-bordered m-2"
                        accept="image/png, image/jpeg"
                        onInput={(e) => {
                          setFileUpload((e.target as HTMLInputElement).files![0])
                        }}
                      />
                    </label>

                    <AppCalls
                      appID={appID}
                      method="add_proposal"
                      file={fileUpload}
                      name={nftName}
                      unitName={unitName}
                      web3StorageToken={web3StorageToken}
                    />

                    <div className="divider" />
                    <label className="label m-2">
                      Proposal ID
                      <input
                        type="number"
                        defaultValue="0"
                        className="input input-bordered"
                        onInput={(e) => {
                          setVoteProposalID((e.target as HTMLInputElement).valueAsNumber)
                        }}
                      />
                    </label>

                    <AppCalls appID={appID} method="vote" proposalID={voteProposalID} />

                    <div className="divider" />
                    <AppCalls appID={appID} method="mint" setAssetID={setAssetID} />
                    <label className="label m-2">
                      Minted Asset
                      <input
                        type="number"
                        value={assetID}
                        className="input input-bordered"
                        readOnly={true}
                        onChange={(e) => (e.target.valueAsNumber ? setAssetID(e.target.valueAsNumber) : setAssetID(0))}
                      />
                    </label>
                  </div>
                )}

                <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
              </div>
            </div>
          </div>
        </div>
      </WalletProvider>
    </SnackbarProvider>
  )
}
