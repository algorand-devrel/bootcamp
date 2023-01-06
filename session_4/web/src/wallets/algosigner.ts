import algosdk from 'algosdk'
declare const AlgoSigner: any

export class AlgoSignerSession {
  accounts: Array<{address: string}>

  constructor () {
    if (typeof AlgoSigner === 'undefined') {
      alert('AlgoSigner is not installed')
    } else {
      AlgoSigner.connect()
    }
  }

  async getAccounts () {
    this.accounts = await AlgoSigner.accounts({ ledger: 'TestNet' })
  }

  async signTxns (unsignedTxns: Array<algosdk.Transaction>) {
    AlgoSigner.signTxns(unsignedTxns.map(txn => AlgoSigner.encoding.msgpackToBase64(txn.toByte())))
  }
}
