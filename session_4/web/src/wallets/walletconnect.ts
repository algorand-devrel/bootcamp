import WalletConnect from '@walletconnect/client'
import QRCodeModal from 'algorand-walletconnect-qrcode-modal'
import algosdk from 'algosdk'
import { formatJsonRpcRequest } from '@json-rpc-tools/utils'

export class WalletConnectSession {
  connector: WalletConnect
  account: string

  constructor () {
    // Create a connector
    this.connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      qrcodeModal: QRCodeModal
    })

    // Check if connection is already established
    if (!this.connector.connected) {
      // create new session
      this.connector.createSession()
    }

    // Subscribe to connection events
    this.connector.on('connect', this.onConnect)

    this.connector.on('session_update', this.onSessionUpdate)

    this.connector.on('disconnect', this.onDisconnect)
  }

  onConnect (error: Error | null, payload: any) {
    if (error) {
      throw error
    }

    // Get provided accounts
    const { accounts } = payload.params[0]
    console.log(accounts)
  }

  onDisconnect (error: Error | null, payload: any) {
    if (error) {
      throw error
    }
  }

  onSessionUpdate (error: Error | null, payload: any) {
    if (error) {
      throw error
    }

    // Get updated accounts
    const { accounts } = payload.params[0]

    this.account = accounts[0]
  }

  async signTxns (unsignedTxns: Array<algosdk.Transaction>) {
    const encodedTxns = unsignedTxns.map(txn => {
      const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64')

      return {
        txn: encodedTxn
      }
    })
    const request = formatJsonRpcRequest('algo_signTxn', [encodedTxns])
    const result: Array<string | null> = await this.connector.sendCustomRequest(request)
    const decodedResult = result.map(element => {
      return element ? new Uint8Array(Buffer.from(element, 'base64')) : null
    })

    return decodedResult
  }
}
