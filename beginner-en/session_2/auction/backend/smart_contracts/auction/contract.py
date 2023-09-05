import beaker
import pyteal as pt


class AuctionState:
    pass
    ##################################
    # Global State
    # 64 key-value pairs per contract
    # 128 bytes each
    ##################################

    # Previous bidder: Address of the previous bidder

    # Previous bid: Amount of the previous bid

    # Auction end: Timestamp of the end of the auction

    # ASA amount: Total amount of ASA being auctioned

    # ASA: ID of the ASA being auctioned

    ##################################
    # Local State
    # 16 key-value pairs per account
    # 128 bytes each
    ##################################

    # Claimable amount: Amount of ALGO this account can reclaim



app = beaker.Application("Auction", state=AuctionState)


# create method that initializes global state

# opt_into_asset method that opts the contract account into an ASA

# start_auction method that starts the auction for a specific length and starting price

# opt_into_app method that allows accounts to opt in to local state

# bid method that allows accounts to bid on the auction

# reclaim_bids method that allows someone to reclaim bids they have previously placed

# claim_asset method that allows the winner to claim the asset

# delete method that allows the owner to delete the contract and retrieve all extra ALGO
