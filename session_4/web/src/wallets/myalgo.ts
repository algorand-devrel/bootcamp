import MyAlgoConnect, { Accounts } from '@randlabs/myalgo-connect'
import algosdk from 'algosdk'

export class MyAlgoSession {
  myAlgoConnect: MyAlgoConnect
  accounts: Array<Accounts>

  constructor () {
    this.myAlgoConnect = new MyAlgoConnect({ disableLedgerNano: false })
  }

  async getAccounts () {
    const settings = {
      shouldSelectOneAccount: false,
      openManager: true
    }

    this.accounts = await this.myAlgoConnect.connect(settings)
  }

  async signTxns (unsignedTxns: Array<algosdk.Transaction>) {
    return await this.myAlgoConnect.signTransaction(unsignedTxns.map(txn => txn.toByte()))
  }
}
