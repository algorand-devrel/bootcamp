# imports

def main():
    # use new_account() method to generate a new account

    # instatiate algod client on localnet

    # get info about my_account from algod

    # instatiate kmd client on localnet

    # fund my_account with ALGO from localnet dispenser

    # create an ASA (Algorand Standard Asset, token, asset, NFT, etc.)

    # sign transaction
 
    # submit transaction
 
    # again, get info about my_account from algod

    # print the assetID of my new asset from algod

    # create other_account

    # fund other_account with ALGO from localnet dispenser

    # ENSURE OTHER_ACCOUNT OPT-IN TO ASSET, ELSE ASSET TRANSFER WILL FAIL
    # OPTIN IS 0 AMOUNT TO SELF

    # SIGN OPTIN TRANSACTION
 
    # SUBMIT TRANSACTION

    # VIEW OTHER_ACCOUNT TO SEE OPTIN

    #####################################################################
    # NEW BELOW
    #####################################################################

    # 1. Create multiple transactions
    # 2. Group them (order is important)
    # 3. Sign the individual transactions within the group
    # 4. Send the signed transaction group
    # txn_1 is Payment 1 ALGO from other_account to my_account
    # txn_2 is AssetTransfer of 1 indexID from my_account to other_account
    # groupTxn = [txn1, txn2]
    # both will complete atomiclly, else none will be confirmed
    
    # send 1 ALGO from other_account to my_account

    # send asset from my_account to other_account

    # group transactions

    # sign transactions

    # assemble transaction group

    #submit atomic transaction group

    # view accounts to confirm atomic transfer

main()