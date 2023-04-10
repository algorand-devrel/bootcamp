#!/usr/bin/env python3

from typing import Final

from beaker import *
from pyteal import *


class AuctionState:
    highest_bidder: Final[GlobalStateValue] = GlobalStateValue(
        stack_type=TealType.bytes,
        default=Bytes(""),
        descr="Address of the highest bidder",
    )

    auction_end: Final[GlobalStateValue] = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Timestamp of the end of the auction",
    )

    highest_bid: Final[GlobalStateValue] = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Amount of the highest bid (uALGO)",
    )

    asa_amt: Final[GlobalStateValue] = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Total amount of ASA being auctioned",
    )

    asa: Final[GlobalStateValue] = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="ID of the ASA being auctioned",
    )


app = Application("Auction", state=AuctionState)


@app.create(bare=True)
def create() -> Expr:
    # Set all global state to the default values
    return app.initialize_global_state()


# Only allow app creator to opt the app account into a ASA
@app.external(authorize=Authorize.only(Global.creator_address()))
def opt_into_asset(asset: abi.Asset) -> Expr:
    return Seq(
        # Verify a ASA hasn't already been opted into
        Assert(app.state.asa == Int(0)),
        # Save ASA ID in global state
        app.state.asa.set(asset.asset_id()),
        # Submit opt-in transaction: 0 asset transfer to self
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.fee: Int(0),  # cover fee with outer txn
                TxnField.asset_receiver: Global.current_application_address(),
                TxnField.xfer_asset: asset.asset_id(),
                TxnField.asset_amount: Int(0),
            }
        ),
    )


@app.external(authorize=Authorize.only(Global.creator_address()))
def start_auction(
    starting_price: abi.Uint64,
    length: abi.Uint64,
    axfer: abi.AssetTransferTransaction,
) -> Expr:
    return Seq(
        # Ensure the auction hasn't already been started
        Assert(app.state.auction_end.get() == Int(0)),
        # Verify axfer
        Assert(axfer.get().asset_receiver() == Global.current_application_address()),
        # Set global state
        app.state.asa_amt.set(axfer.get().asset_amount()),
        app.state.auction_end.set(Global.latest_timestamp() + length.get()),
        app.state.highest_bid.set(starting_price.get()),
    )


@Subroutine(TealType.none)
def pay(receiver: Expr, amount: Expr) -> Expr:
    return InnerTxnBuilder.Execute(
        {
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: receiver,
            TxnField.amount: amount,
            TxnField.fee: Int(0),  # cover fee with outer txn
        }
    )


@app.external
def bid(payment: abi.PaymentTransaction, previous_bidder: abi.Account) -> Expr:
    return Seq(
        # Ensure auction hasn't ended
        Assert(Global.latest_timestamp() < app.state.auction_end.get()),
        # Verify payment transaction
        Assert(payment.get().amount() > app.state.highest_bid.get()),
        Assert(Txn.sender() == payment.get().sender()),
        # Return previous bid if there was one
        If(
            app.state.highest_bidder.get() != Bytes(""),
            pay(app.state.highest_bidder.get(), app.state.highest_bid.get()),
        ),
        # Set global state
        app.state.highest_bid.set(payment.get().amount()),
        app.state.highest_bidder.set(payment.get().sender()),
    )


@app.external
def claim_bid() -> Expr:
    return Seq(
        # Auction end check is commented out for automated testing
        # Assert(Global.latest_timestamp() > app.state.auction_end.get()),
        pay(Global.creator_address(), app.state.highest_bid.get()),
    )


@app.external
def claim_asset(asset: abi.Asset, asset_creator: abi.Account) -> Expr:
    return Seq(
        # Auction end check is commented out for automated testing
        # Assert(Global.latest_timestamp() > app.state.auction_end.get()),
        # Send ASA to highest bidder
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.fee: Int(0),  # cover fee with outer txn
                TxnField.xfer_asset: app.state.asa,
                TxnField.asset_amount: app.state.asa_amt,
                TxnField.asset_receiver: app.state.highest_bidder,
                # Close to asset creator since they are guranteed to be opted in
                TxnField.asset_close_to: asset_creator.address(),
            }
        ),
    )


@app.delete
def delete() -> Expr:
    return InnerTxnBuilder.Execute(
        {
            TxnField.type_enum: TxnType.Payment,
            TxnField.fee: Int(0),  # cover fee with outer txn
            TxnField.receiver: Global.creator_address(),
            # close_remainder_to to sends full balance, including 0.1 account MBR
            TxnField.close_remainder_to: Global.creator_address(),
            # we are closing the account, so amount can be zero
            TxnField.amount: Int(0),
        }
    )


if __name__ == "__main__":
    app.build().export()
