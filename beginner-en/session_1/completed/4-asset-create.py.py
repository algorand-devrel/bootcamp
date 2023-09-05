import algosdk
import algokit_utils as algokit
from pprint import pprint

def main():
    # use new_account() method to generate a new account
    my_account = algokit.Account.new_account()
    print("address: ", my_account.address)

    # instatiate algod client on localnet
    algod = algokit.get_algod_client(algokit.get_default_localnet_config("algod"))

    # get info about my_account from algod
    pprint(algod.account_info(my_account.address))

    # instatiate kmd client on localnet
    kmd = algokit.get_kmd_client_from_algod_client(algod)

    # fund my_account with ALGO from localnet dispenser
    algokit.ensure_funded(
        algod,
        algokit.EnsureBalanceParameters(
            account_to_fund=my_account.address,
            min_spending_balance_micro_algos=1_000_000
        )
    )

    # create an ASA (Algorand Standard Asset, token, asset, NFT, etc.)
    unsigned_txn = algosdk.transaction.AssetCreateTxn(
        sender=my_account.address,
        sp=algod.suggested_params(),
        total=1,
        decimals=0,
        default_frozen=False
    )

    # sign transaction
    signed_txn = unsigned_txn.sign(my_account.private_key)

    # submit transaction
    txid = algod.send_transaction(signed_txn)
    print("Successfully sent transaction with txID: {}".format(txid))     
 
     # again, get info about my_account from algod
    pprint(algod.account_info(my_account.address))

    # print the assetID of my new asset from algod
    results = algod.pending_transaction_info(txid)
    print("assetID: ", results["asset-index"])

main()
