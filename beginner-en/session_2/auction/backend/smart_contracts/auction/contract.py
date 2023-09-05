import beaker
import pyteal as pt


class AuctionState:
    ##################################
    # Global State
    # 64 key-value pairs per contract
    # 128 bytes each
    ##################################

    # Previous bidder: Address of the previous bidder
    previous_bidder = beaker.GlobalStateValue(
        stack_type=pt.TealType.bytes, default=pt.Bytes("")
    )

    # Previous bid: Amount of the previous bid
    previous_bid = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )
    
    # Auction end: Timestamp of the end of the auction
    auction_end = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )
    
    # REMINDER: ASA === Algorand Standard Asset === Asset === Token

    # ASA: ID of the ASA being auctioned
    asa_id = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # ASA amount: Total amount of ASA being auctioned
    asa = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    ##################################
    # Local State
    # 16 key-value pairs per account
    # 128 bytes each
    # Users must opt in before using
    ##################################

    # Claimable amount: Amount of ALGO this account can reclaim
    claimable_amount = beaker.LocalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )


app = beaker.Application("Auction", state=AuctionState)


# create method that initializes global state
@app.create(bare=True)
def create() -> pt.Expr:
    return.app.initialize_global_state()
    
# opt_into_asset method that opts the contract account into an ASA

# start_auction method that starts the auction for a specific length and starting price

# opt_into_app method that allows accounts to opt in to local state

# bid method that allows accounts to bid on the auction

# reclaim_bids method that allows someone to reclaim bids they have previously placed

# claim_asset method that allows the winner to claim the asset

# delete method that allows the owner to delete the contract and retrieve all extra ALGO
