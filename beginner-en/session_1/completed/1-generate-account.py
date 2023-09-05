# don't forget to `pip install algokit-utils` and import as algokit
import algokit_utils as algokit

def main():
    # use new_account() method to generate a new account
    my_account = algokit.Account.new_account()

    # print the address of the account object
    print("address: ", my_account.address)

main()
