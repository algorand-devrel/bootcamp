from algosdk import kmd
from algosdk.wallet import Wallet
from algosdk.v2client import algod
from algosdk.future import transaction
import json
import base64

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

    # build unsigned transaction
    params = algod_client.suggested_params()
    unsigned_txn = transaction.AssetConfigTxn(sender=addr1,
            sp=params,
            total=10000,   # Fungible tokens have total issuance greater than 1
            default_frozen=False,
            unit_name="FUNTOK",
            asset_name="Fun Token",
            manager=addr1,
            strict_empty_address_check=False,
            reserve="",
            freeze="",
            clawback="",
            url="https://path/to/my/fungible/asset/metadata.json",
            metadata_hash="", # Typically include hash of metadata.json (bytes) 
            decimals=2    # Fungible tokens typically have decimals greater than 0
    )
    
    # sign transaction
    signed_txn = unsigned_txn.sign(wallet.export_key(addr1))

    #submit transaction
    txid = algod_client.send_transaction(signed_txn)
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
