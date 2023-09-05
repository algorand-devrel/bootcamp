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
 
    #submit transaction
    txid = algod.send_transaction(signed_txn)
    print("Successfully sent transaction with txID: {}".format(txid))     
 
     # again, get info about my_account from algod
    pprint(algod.account_info(my_account.address))

    # print the assetID of my new asset from algod
    results = algod.pending_transaction_info(txid)
    assetID = results["asset-index"]
    print("assetID: ", assetID)

    #####################################################################
    # NEW BELOW
    #####################################################################

    # create other_account
    other_account = algokit.Account.new_account()
    print("address: ", other_account.address)

    # fund other_account with ALGO from localnet dispenser
    algokit.ensure_funded(
        algod,
        algokit.EnsureBalanceParameters(
            account_to_fund=other_account.address,
            min_spending_balance_micro_algos=1_000_000
        )
    ) 

    # ENSURE OTHER_ACCOUNT OPT-IN TO ASSET, ELSE ASSET TRANSFER WILL FAIL
    # OPTIN IS 0 AMOUNT TO SELF
    unsigned_txn = algosdk.transaction.AssetTransferTxn(
        sender=other_account.address,
        sp=algod.suggested_params(),
        receiver=other_account.address,
        amt=0,
        index=assetID,
    )

    # SIGN OPTIN TRANSACTION
    signed_txn = unsigned_txn.sign(other_account.private_key)
 
    # SUBMIT TRANSACTION
    txid = algod.send_transaction(signed_txn)
    print("Successfully sent transaction with txID: {}".format(txid))

     # VIEW OTHER_ACCOUNT TO SEE OPTIN
    pprint(algod.account_info(other_account.address))

    # send asset from my_account to other_account
    unsigned_txn = algosdk.transaction.AssetTransferTxn(
        sender=my_account.address,
        sp=algod.suggested_params(),
        receiver=other_account.address,
        amt=1,
        index=assetID,
    )

    # sign transaction
    signed_txn = unsigned_txn.sign(my_account.private_key)
 
    # submit transaction
    txid = algod.send_transaction(signed_txn)
    print("Successfully sent transaction with txID: {}".format(txid))

    # view other_account to confirm assest transfer
    pprint(algod.account_info(other_account.address))

main()
