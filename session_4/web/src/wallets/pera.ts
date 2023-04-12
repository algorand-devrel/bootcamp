import { PeraWalletConnect } from '@perawallet/connect'
import algosdk from 'algosdk'

export class PeraSession {
  peraConnect: PeraWalletConnect
  accounts: string[]

  constructor () {
    this.peraConnect = new PeraWalletConnect({
      shouldShowSignTxnToast: false
    })
  }

  async getAccounts () {
    try {
      this.accounts = await this.peraConnect.connect()
    } catch (error) {
      if (error?.data?.type === 'SESSION_CONNECT') {
        await this.peraConnect.disconnect()
        await this.getAccounts()
      } else if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        console.warn(error)
      }
    }
  }

  async signTxns (unsignedTxns: Array<algosdk.Transaction>) {
    const signerTransactions = unsignedTxns.map(txn => {
      return {
        txn,
        signers: [algosdk.encodeAddress(txn.from.publicKey)]
      }
    })
    return await this.peraConnect.signTransaction([signerTransactions])
  }
}
