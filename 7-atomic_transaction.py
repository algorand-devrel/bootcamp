from algosdk.future import transaction
import json
import base64

from algosdk import kmd
from algosdk.wallet import Wallet
from algosdk.v2client import algod

# define sandbox values for kmd client
kmd_address = "http://localhost:4002"
kmd_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    
# define sandbox values for algod client
algod_address = "http://localhost:4001"
algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    
def main() :
    # create KMDClient
    kmd_client = kmd.KMDClient(kmd_token, kmd_address)

    # connect to default wallet
    wallet = Wallet("unencrypted-default-wallet", "", kmd_client)

    # gather the three default accounts and corrisponding mnemonic passphrase
    wallet_addresses = wallet.list_keys()
    addr1 = wallet_addresses[0]
    addr2 = wallet_addresses[1]
    addr3 = wallet_addresses[2]

    # create algod client
    algod_client = algod.AlgodClient(algod_token, algod_address)

    # build unsigned payment transaction
    params = algod_client.suggested_params()
    sender = addr2
    receiver = addr1
    amount = 1000000
    txn_1 = transaction.PaymentTxn(sender, params, receiver, amount)

    # build unsigned asset transfer transaction
    sender = addr1
    receiver = addr2
    amount = 10
    index = 5   # this is the asset-index returned by asset_create.py 
    txn_2 = transaction.AssetTransferTxn(sender, params, receiver, amount, index)

    # group transactions
    gid = transaction.calculate_group_id([txn_1, txn_2])
    txn_1.group = gid
    txn_2.group = gid

    # sign transaction
    stxn_1 = txn_1.sign(wallet.export_key(addr2))    
    stxn_2 = txn_2.sign(wallet.export_key(addr1))

    # assemble transaction group
    signed_group = [stxn_1, stxn_2]

    #submit atomic transaction group
    txid = algod_client.send_transactions(signed_group)
    print("Successfully sent transaction with txID: {}".format(txid))

    # wait for confirmation 
    try:
        confirmed_txn = transaction.wait_for_confirmation(algod_client, txid, 4)  
    except Exception as err:
        print(err)
        return

    print("Transaction information: {}".format(
        json.dumps(confirmed_txn, indent=4)))

main()