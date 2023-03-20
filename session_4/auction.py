from beaker import *
from pyteal import *
from typing import Final


class Auction(Application):
    highest_bidder: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.bytes,
        default=Bytes(""),
        descr="Address of the highest bidder",
    )

    auction_end: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="The timestamp of the auction end",
    )

    highest_bid: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0), descr="The value of the highest bid"
    )

    asa_amt: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="The amount of the ASA being auctioned",
    )

    asa: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="The ID of the ASA being auctioned",
    )

    @create
    def create(self):
        return self.initialize_application_state()

    @external(authorize=Authorize.only(Global.creator_address()))
    def opt_into_asset(self, asset: abi.Asset):
        return Seq(
            Assert(self.asa == Int(0)),
            self.asa.set(asset.asset_id()),
            InnerTxnBuilder.Execute(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.asset_receiver: Global.current_application_address(),
                    TxnField.xfer_asset: asset.asset_id(),
                    TxnField.asset_amount: Int(0),
                    TxnField.fee: Int(0),
                }
            ),
        )

    @external(authorize=Authorize.only(Global.creator_address()))
    def start_auction(
        self,
        starting_price: abi.Uint64,
        length: abi.Uint64,
        axfer: abi.AssetTransferTransaction,
    ):
        return Seq(
            Assert(self.auction_end == Int(0)),
            Assert(
                axfer.get().asset_receiver() == Global.current_application_address()
            ),
            self.asa_amt.set(axfer.get().asset_amount()),
            self.auction_end.set(length.get() + Global.latest_timestamp()),
            self.highest_bid.set(starting_price.get()),
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

    @external
    def bid(self, payment: abi.PaymentTransaction, previous_bidder: abi.Account):
        return Seq(
            Assert(Global.latest_timestamp() < self.auction_end),
            Assert(payment.get().amount() > self.highest_bid),
            Assert(payment.get().receiver() == Global.current_application_address()),
            Assert(Txn.sender() == payment.get().sender()),
            If(
                self.highest_bidder != Bytes(""),
                Seq(
                    Assert(self.highest_bidder == previous_bidder.address()),
                    self.pay(previous_bidder.address(), self.highest_bid),
                )
            ),
            self.highest_bid.set(payment.get().amount()),
            self.highest_bidder.set(Txn.sender()),
        )

    @external
    def claim_bid(self):
        return Seq(
            Assert(Global.latest_timestamp() > self.auction_end),
            self.pay(Global.creator_address(), self.highest_bid),
        )

    @external
    def claim_asset(self, asset: abi.Asset, asset_creator: abi.Account):
        return Seq(
            Assert(Global.latest_timestamp() > self.auction_end),
            InnerTxnBuilder.Execute(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.fee: Int(0),
                    TxnField.xfer_asset: self.asa,
                    TxnField.asset_receiver: self.highest_bidder,
                    TxnField.asset_close_to: self.highest_bidder,
                }
            ),
        )

    @delete
    def delete(self):
        return InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.fee: Int(0),
                TxnField.receiver: Global.creator_address(),
                TxnField.close_remainder_to: Global.creator_address(),
                TxnField.amount: Int(0),
            }
        )


auction_instance = Auction(version=8)
auction_instance.dump()
