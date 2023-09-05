import algokit_utils as algokit
from pprint import pprint

def main():
    # instatiate algod client on localnet
    algod = algokit.get_algod_client(algokit.get_default_localnet_config("algod"))

    # instatiate kmd client on localnet
    kmd = algokit.get_kmd_client_from_algod_client(algod)

    # create my_account
    my_account = algokit.Account.new_account()
    print("address: ",my_account.address)

    # get info about my_account from algod
    pprint(algod.account_info(my_account.address))

    # set localnet default account from KMD as other_account
    other_account = algokit.get_localnet_default_account(algod)

    txn = algokit.transfer(algod, algokit.TransferParameters(
        from_account=other_account.signer,
        to_address=my_account.address,
        micro_algos=1_000_000
        )
    )

    # again, get info about my_account from algod
    pprint(algod.account_info(my_account.address))
 
main()
