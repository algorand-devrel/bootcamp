#!/usr/bin/env python3
from pyteal import *
from beaker import *
import os
import json
from typing import Final

APP_CREATOR = Seq(creator := AppParam.creator(Int(0)), creator.value())


class Auction(Application):
    highest_bidder: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.bytes, default=Bytes("")
    )

    auction_end: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    highest_bid: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    asa_amt: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    asa: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    @internal(TealType.none)
    def pay(self, receiver: Expr, amount: Expr):
        return InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: receiver,
                TxnField.amount: amount,
                TxnField.fee: Int(0),
            }
        )

    @create
    def create(self):
        return self.initialize_application_state()

    @external(authorize=Authorize.only(APP_CREATOR))
    def opt_into_asset(self, asset: abi.Asset):
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

    @external(authorize=Authorize.only(APP_CREATOR))
    def start_auction(
        self,
        starting_price: abi.Uint64,
        length: abi.Uint64,
        axfer: abi.AssetTransferTransaction,
    ):
        return Seq(
            Assert(self.auction_end.get() == Int(0)),
            # Process axfer
            Assert(
                axfer.get().asset_receiver() == Global.current_application_address()
            ),
            Assert(axfer.get().asset_close_to() == Global.zero_address()),
            Assert(axfer.get().xfer_asset() == self.asa.get()),
            self.asa_amt.set(axfer.get().asset_amount()),
            # Set global state
            self.auction_end.set(Global.latest_timestamp() + length.get()),
            self.highest_bid.set(starting_price.get()),
        )

    @external
    def bid(self, payment: abi.PaymentTransaction, previous_bidder: abi.Account):
        return Seq(
            Assert(Global.latest_timestamp() < self.auction_end.get()),
            # Verify payment transaction
            Assert(payment.get().amount() > self.highest_bid.get()),
            Assert(Txn.sender() == payment.get().sender()),
            # Return previous bid
            If(
                self.highest_bidder.get() != Bytes(""),
                Seq(
                    Assert(self.highest_bidder.get() == previous_bidder.address()),
                    self.pay(self.highest_bidder.get(), self.highest_bid.get()),
                ),
            ),
            # Set global state
            self.highest_bid.set(payment.get().amount()),
            self.highest_bidder.set(payment.get().sender()),
        )

    @external
    def claim_bid(self):
        return Seq(
            # Assert(Global.latest_timestamp() > self.auction_end.get()),
            self.pay(APP_CREATOR, self.highest_bid.get()),
        )

    @external
    def claim_asset(
        self, asset: abi.Asset, creator: abi.Account, asset_creator: abi.Account
    ):
        return Seq(
            # Assert(Global.latest_timestamp() > self.auction_end.get()),
            Assert(asset.asset_id() == self.asa.get()),
            Assert(creator.address() == APP_CREATOR),
            # Send ASA to highest bidder
            InnerTxnBuilder.Execute(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.fee: Int(0),
                    TxnField.xfer_asset: asset.asset_id(),
                    TxnField.asset_amount: self.asa_amt.get(),
                    TxnField.asset_receiver: self.highest_bidder.get(),
                    # Close to creator in caseof additional ASA being sent throughout duration of auction
                    TxnField.asset_close_to: Seq(
                        creator := asset.params().creator_address(), creator.value()
                    ),
                }
            ),
        )

    @delete
    def delete():
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
