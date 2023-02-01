#!/usr/bin/env python3
from pyteal import *
from beaker import *
import os
import json
from typing import Final

APP_CREATOR = Seq(creator := AppParam.creator(Int(0)), creator.value())


class Auction(Application):
    # Global State
    # - Highest Bidder: The address of the highest bidder
    highest_bidder: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.bytes, default=Bytes("")
    )

    # - Highest Bid: The amount of the highest bid
    highest_bid: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    # - Auction End: The timestamp when the auction ends
    auction_end: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    # - ASA: The ASA being auctioned
    asa: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    # - ASA Amount: The amount of ASA being auctioned
    asa_amount: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    # Create Application
    @create
    def create(self):
        return self.initialize_application_state()

    # Opt app into ASA
    @external(authorize=Authorize.only(APP_CREATOR))
    def opt_into_asa(self, asset: abi.Asset):
        return Seq(
            Assert(self.asa == Int(0)),
            self.asa.set(asset.asset_id()),
            InnerTxnBuilder.Execute(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.fee: Int(0),
                    TxnField.asset_receiver: Global.current_application_address(),
                    TxnField.xfer_asset: asset.asset_id(),
                    TxnField.asset_amount: Int(0),
                }
            ),
        )

    # Start auction
    # Need to define starting price and length of auction
    # We also need to ensure the ASA is sent to the app
    @external(authorize=Authorize.only(APP_CREATOR))
    def start_auction(
        self,
        starting_price: abi.Uint64,
        length: abi.Uint64,
        axfer: abi.AssetTransferTransaction,
    ):
        return Seq(
            Assert(self.auction_end.get() == Int(0)),
            Assert(
                axfer.get().asset_receiver() == Global.current_application_address()
            ),
            Assert(axfer.get().xfer_asset() == self.asa.get()),
            self.asa_amount.set(axfer.get().asset_amount()),
            self.auction_end.set(length.get() + Global.latest_timestamp()),
            self.highest_bid.set(starting_price.get()),
        )

    @internal(TealType.none)
    def pay(self, receiver, amount):
        return InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: receiver,
                TxnField.amount: amount,
                TxnField.fee: Int(0),
            }
        )

    # Bid
    # Place a new bid and return previous bid
    @external
    def bid(self, payment: abi.PaymentTransaction, previous_bidder: abi.Account):
        return Seq(
            Assert(Global.latest_timestamp() < self.auction_end.get()),
            Assert(payment.get().amount() > self.highest_bid.get()),
            Assert(Txn.sender() == payment.get().sender()),
            Assert(payment.get().receiver() == Global.current_application_address()),
            If(
                self.highest_bidder.get() != Bytes(""),
                Seq(
                    Assert(self.highest_bidder.get() == previous_bidder.address()),
                    self.pay(self.highest_bidder.get(), self.highest_bid.get()),
                ),
            ),
            self.highest_bid.set(payment.get().amount()),
            self.highest_bidder.set(payment.get().sender()),
        )

    # Claim bid
    # Let's the auctioner claim the highest bid once the auction has ended
    @external
    def claim_bid(self):
        return Seq(
            Assert(Global.latest_timestamp() > self.auction_end.get()),
            self.pay(APP_CREATOR, self.highest_bid.get()),
        )

    # Claim asset
    # Let's the highest bidder claim the asset once the auction has ended
    @external
    def claim_asset(
        self, asset: abi.Asset, creator: abi.Account, asset_creator: abi.Account
    ):
        return Seq(
            Assert(Global.latest_timestamp() > self.auction_end.get()),
            Assert(creator.address() == APP_CREATOR),
            Assert(asset.asset_id() == self.asa.get()),
            InnerTxnBuilder.Execute(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.fee: Int(0),
                    TxnField.xfer_asset: asset.asset_id(),
                    TxnField.asset_amount: self.asa_amount.get(),
                    TxnField.asset_close_to: Seq(
                        asa_creator := asset.params().creator_address(),
                        asa_creator.value(),
                    ),
                }
            ),
        )

    # Delete app
    # Send MBR funds to creator and delete app
    @delete
    def delete(self):
        return InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.fee: Int(0),
                TxnField.receiver: APP_CREATOR,
                TxnField.amount: Int(0),
                TxnField.close_remainder_to: APP_CREATOR,
            }
        )


if __name__ == "__main__":
    app = Auction(version=7)

    if os.path.exists("approval.teal"):
        os.remove("approval.teal")

    if os.path.exists("approval.teal"):
        os.remove("clear.teal")

    if os.path.exists("abi.json"):
        os.remove("abi.json")

    if os.path.exists("app_spec.json"):
        os.remove("app_spec.json")

    with open("approval.teal", "w") as f:
        f.write(app.approval_program)

    with open("clear.teal", "w") as f:
        f.write(app.clear_program)

    with open("abi.json", "w") as f:
        f.write(json.dumps(app.contract.dictify(), indent=4))

    with open("app_spec.json", "w") as f:
        f.write(json.dumps(app.application_spec(), indent=4))
