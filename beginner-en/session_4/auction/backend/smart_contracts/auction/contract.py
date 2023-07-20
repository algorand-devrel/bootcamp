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
    asa = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # ASA amount: Total amount of ASA being auctioned
    asa_amount = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )

    ##################################
    # Local State
    # 16 key-value pairs per account
    # 128 bytes each
    # Users must opt in before using
    ##################################

    # Claimable amount: Amount of ALGO this account can reclaim from their bids
    claimable_amount = beaker.LocalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )


app = beaker.Application("Auction", state=AuctionState)


# create method that initializes global state
@app.create(bare=True)
def create() -> pt.Expr:
    return app.initialize_global_state()


# opt_into_asset method that opts the contract account into an ASA
@app.external(authorize=beaker.Authorize.only(pt.Global.creator_address()))
def opt_into_asset(asset: pt.abi.Asset) -> pt.Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return pt.Seq(
        # Check the asa in state hasn't already been set
        pt.Assert(app.state.asa == pt.Int(0)),
        # Set app.state.asa to the asa being auctioned
        app.state.asa.set(asset.asset_id()),
        # Send the transaction to opt in
        # Opt == transfer of 0 amount from/to the same account
        # Send a 0 asset transfer, of asset, from contract to contract
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetTransfer,
                pt.TxnField.asset_receiver: pt.Global.current_application_address(),
                pt.TxnField.xfer_asset: asset.asset_id(),
                pt.TxnField.asset_amount: pt.Int(0),
                # Nomrally fees are 0.0001 ALGO
                # An inner transaction is 0.0001 ALGO
                # Setting inner transaction fee to 0, means outer fee must be 0.0002 ALGO
                pt.TxnField.fee: pt.Int(0),
            }
        ),
    )


# start_auction method that starts the auction for a specific length and starting price
# axfer === short hand for Asset Transfer
@app.external(authorize=beaker.Authorize.only(pt.Global.creator_address()))
def start_auction(
    starting_price: pt.abi.Uint64,
    length: pt.abi.Uint64,
    axfer: pt.abi.AssetTransferTransaction,
) -> pt.Expr:
    return pt.Seq(
        # Ensure the auction hasn't already started
        pt.Assert(app.state.auction_end.get() == pt.Int(0)),
        # Set starting price
        app.state.previous_bid.set(starting_price.get()),
        # Set the auction end time
        # Time always corresponds to the timestamp of the last block
        # There might be some clock skew across nodes
        # Time is NEVER precise to the second
        # Timestamps is using seconds as a unit
        app.state.auction_end.set(length.get() + pt.Global.latest_timestamp()),
        # Verify the asset transfer is to the contract address
        pt.Assert(
            axfer.get().asset_receiver() == pt.Global.current_application_address()
        ),
        # Set the asa amount being auctioned
        app.state.asa_amount.set(axfer.get().asset_amount()),
        # Save the amount transfered in global state
        app.state.asa.set(axfer.get().xfer_asset()),
    )


# opt_into_app method that allows accounts to opt in to local state
@app.opt_in(bare=True)
def opt_in() -> pt.Expr:
    return app.state.claimable_amount[pt.Txn.sender()].set_default()


# bid method that allows accounts to bid on the auction
@app.external
def bid(payment: pt.abi.PaymentTransaction) -> pt.Expr:
    return pt.Seq(
        # Verify the auction hasn't ended
        pt.Assert(app.state.auction_end.get() > pt.Global.latest_timestamp()),
        # Verify the auction has started
        pt.Assert(app.state.auction_end.get() != pt.Int(0)),
        # Assert the bid amount is greater than the previous bid
        pt.Assert(payment.get().amount() > app.state.previous_bid.get()),
        # Assert the receiver is the contract address
        pt.Assert(payment.get().receiver() == pt.Global.current_application_address()),
        #
        # OLD WAY:
        # if there is a previous bidder
        # then send back the previous bid to their account
        #
        # NEW WAY:
        # save bid amount in local state
        #
        # REASON FOR CHANGING:
        # - Algorand requires any accounts used in an inner transaction, to be pre-defined
        # - This means there's a possible race condition, only allowing one bid per block
        #
        # Update global state: update previous bidder to current caller
        app.state.previous_bidder.set(payment.get().sender()),
        # Update global state: update previous_bid to current bid
        app.state.previous_bid.set(payment.get().amount()),
        # Update local state: Add bid to claimable bids
        app.state.claimable_amount[pt.Txn.sender()].set(
            app.state.claimable_amount[pt.Txn.sender()] + payment.get().amount()
        ),
    )


@pt.Subroutine(pt.TealType.none)
def pay(receiver: pt.Expr, amount: pt.Expr) -> pt.Expr:
    return pt.InnerTxnBuilder.Execute(
        {
            pt.TxnField.type_enum: pt.TxnType.Payment,
            pt.TxnField.fee: pt.Int(0),
            pt.TxnField.amount: amount,
            pt.TxnField.receiver: receiver,
        }
    )


# reclaim_bids method that allows someone to reclaim bids they have previously placed
@app.external
def reclaim_bids() -> pt.Expr:
    # Sends a payment via a inner transaction (InnerTxnBuilder.execute())
    return pt.Seq(
        # If the claimer is the previous bidder
        #
        # PYTHON IF CONDITION:
        # if cond:
        #     whatever we want to happen
        # - We cannot use python if conditions
        # - We must use pt.If
        #
        pt.If(pt.Txn.sender() == app.state.previous_bidder.get())
        # Then reuturn (send payment) claimable bids - previous_bid
        .Then(
            pay(
                pt.Txn.sender(),
                app.state.claimable_amount[pt.Txn.sender()].get()
                - app.state.previous_bid.get(),
            )
        )
        # Else return full claimable amount
        .Else(pay(pt.Txn.sender(), app.state.claimable_amount[pt.Txn.sender()].get()))
    )


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
    asa = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # ASA amount: Total amount of ASA being auctioned
    asa_amount = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )

    ##################################
    # Local State
    # 16 key-value pairs per account
    # 128 bytes each
    # Users must opt in before using
    ##################################

    # Claimable amount: Amount of ALGO this account can reclaim from their bids
    claimable_amount = beaker.LocalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )


app = beaker.Application("Auction", state=AuctionState)


# create method that initializes global state
@app.create(bare=True)
def create() -> pt.Expr:
    return app.initialize_global_state()


# opt_into_asset method that opts the contract account into an ASA
@app.external(authorize=beaker.Authorize.only(pt.Global.creator_address()))
def opt_into_asset(asset: pt.abi.Asset) -> pt.Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return pt.Seq(
        # Check the asa in state hasn't already been set
        pt.Assert(app.state.asa == pt.Int(0)),
        # Set app.state.asa to the asa being auctioned
        app.state.asa.set(asset.asset_id()),
        # Send the transaction to opt in
        # Opt == transfer of 0 amount from/to the same account
        # Send a 0 asset transfer, of asset, from contract to contract
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetTransfer,
                pt.TxnField.asset_receiver: pt.Global.current_application_address(),
                pt.TxnField.xfer_asset: asset.asset_id(),
                pt.TxnField.asset_amount: pt.Int(0),
                # Nomrally fees are 0.0001 ALGO
                # An inner transaction is 0.0001 ALGO
                # Setting inner transaction fee to 0, means outer fee must be 0.0002 ALGO
                pt.TxnField.fee: pt.Int(0),
            }
        ),
    )


# start_auction method that starts the auction for a specific length and starting price
# axfer === short hand for Asset Transfer
@app.external(authorize=beaker.Authorize.only(pt.Global.creator_address()))
def start_auction(
    starting_price: pt.abi.Uint64,
    length: pt.abi.Uint64,
    axfer: pt.abi.AssetTransferTransaction,
) -> pt.Expr:
    return pt.Seq(
        # Ensure the auction hasn't already started
        pt.Assert(app.state.auction_end.get() == pt.Int(0)),
        # Set starting price
        app.state.previous_bid.set(starting_price.get()),
        # Set the auction end time
        # Time always corresponds to the timestamp of the last block
        # There might be some clock skew across nodes
        # Time is NEVER precise to the second
        # Timestamps is using seconds as a unit
        app.state.auction_end.set(length.get() + pt.Global.latest_timestamp()),
        # Verify the asset transfer is to the contract address
        pt.Assert(
            axfer.get().asset_receiver() == pt.Global.current_application_address()
        ),
        # Set the asa amount being auctioned
        app.state.asa_amount.set(axfer.get().asset_amount()),
        # Save the amount transfered in global state
        app.state.asa.set(axfer.get().xfer_asset()),
    )


# opt_into_app method that allows accounts to opt in to local state
@app.opt_in(bare=True)
def opt_in() -> pt.Expr:
    return app.state.claimable_amount[pt.Txn.sender()].set_default()


# bid method that allows accounts to bid on the auction
@app.external
def bid(payment: pt.abi.PaymentTransaction) -> pt.Expr:
    return pt.Seq(
        # Verify the auction hasn't ended
        pt.Assert(app.state.auction_end.get() > pt.Global.latest_timestamp()),
        # Verify the auction has started
        pt.Assert(app.state.auction_end.get() != pt.Int(0)),
        # Assert the bid amount is greater than the previous bid
        pt.Assert(payment.get().amount() > app.state.previous_bid.get()),
        # Assert the receiver is the contract address
        pt.Assert(payment.get().receiver() == pt.Global.current_application_address()),
        #
        # OLD WAY:
        # if there is a previous bidder
        # then send back the previous bid to their account
        #
        # NEW WAY:
        # save bid amount in local state
        #
        # REASON FOR CHANGING:
        # - Algorand requires any accounts used in an inner transaction, to be pre-defined
        # - Needs to be pre-defiend, so the AVM can load it into memory
        # - This means there's a possible race condition, only allowing one bid per block
        #
        # EXAMPLE:
        # 1. Alice bids 1 ALGO in block 0
        # - Latest block is block 0
        # 2. Bob queries the chain to get previous bidder
        # - Previous bidder is Alice
        # 3. Carol queries the chain to get previous bidder
        # - Previous bidder is Alice
        # 4. Bob tries to bid 2 ALGO in block 1
        # - Defines Alice as previous bidder
        # 5. Carol tries to bid 3 ALGO in block 1
        # - Defines Alice as previous bidder
        # 6. Block proposer gets Bob's and Carol's bid
        # - Places Bob's bid first in block 1
        # 7. Previous bidder is updated to Bob
        # 8. Carol's transaction is invalid, because her previous bidder is Alice not Bob
        # Update global state: update previous bidder to current caller
        app.state.previous_bidder.set(payment.get().sender()),
        # Update global state: update previous_bid to current bid
        app.state.previous_bid.set(payment.get().amount()),
        # Update local state: Add bid to claimable bids
        app.state.claimable_amount[pt.Txn.sender()].set(
            app.state.claimable_amount[pt.Txn.sender()] + payment.get().amount()
        ),
    )


@pt.Subroutine(pt.TealType.none)
def pay(receiver: pt.Expr, amount: pt.Expr) -> pt.Expr:
    return pt.InnerTxnBuilder.Execute(
        {
            pt.TxnField.type_enum: pt.TxnType.Payment,
            pt.TxnField.fee: pt.Int(0),
            pt.TxnField.amount: amount,
            pt.TxnField.receiver: receiver,
        }
    )


# reclaim_bids method that allows someone to reclaim bids they have previously placed
@app.external
def reclaim_bids() -> pt.Expr:
    # Sends a payment via a inner transaction (InnerTxnBuilder.execute())
    return pt.Seq(
        # If the claimer is the previous bidder
        #
        # PYTHON IF CONDITION:
        # if cond:
        #     whatever we want to happen
        # - We cannot use python if conditions
        # - We must use pt.If
        #
        pt.If(pt.Txn.sender() == app.state.previous_bidder.get())
        # Then reuturn (send payment) claimable bids - previous_bid
        .Then(
            pt.Seq(pay(
                pt.Txn.sender(),
                app.state.claimable_amount[pt.Txn.sender()].get()
                - app.state.previous_bid.get(),
            ), 
            app.state.claimable_amount[pt.Txn.sender()].set(app.state.previous_bid.get())
            )
        )
        # Else return full claimable amount
        .Else(
            pt.Seq(
                pay(pt.Txn.sender(), app.state.claimable_amount[pt.Txn.sender()].get()),
                app.state.claimable_amount[pt.Txn.sender()].set(pt.Int(0))
            )
        )
    )


# claim_asset method that allows the winner to claim the asset
@app.external
def claim_asset() -> pt.Expr:
    return pt.Seq(
        # Ensure acution ended
        pt.Assert(pt.Global.latest_timestamp() > app.state.auction_end.get()),
        # Send asset to auction winner (inner txn)
        pt.InnerTxnBuilder.Execute({
            pt.TxnField.type_enum: pt.TxnType.AssetTransfer,
            pt.TxnField.asset_receiver: app.state.previous_bidder.get(),
            pt.TxnField.xfer_asset: app.state.asa.get(),
            pt.TxnField.asset_amount: app.state.asa_amount.get(),
            pt.TxnField.asset_close_to: app.state.asa_amount.get(),
            pt.TxnField.fee: pt.Int(0),
        })
    )


# delete method that allows the owner to delete the contract and retrieve all extra ALGO
@app.delete(bare=True)
def delete() -> pt.Expr:
    return pt.Seq(
        # ensure auction is over
        pt.Assert(pt.Global.latest_timestamp() > app.state.auction_end.get()),
        # Allow creator to withdraw all remaining ALGO
        pt.InnerTxnBuilder.Execute({
            pt.TxnField.type_enum: pt.TxnType.Payment,
            pt.TxnField.receiver: pt.Global.creator_address(),
            pt.TxnField.amount: pt.Int(0),
            pt.TxnField.close_remainder_to: pt.Global.creator_address(),
        })
    )
