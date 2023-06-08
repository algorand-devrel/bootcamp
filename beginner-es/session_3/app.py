from beaker import *
from pyteal import *


class MyState:
    highest_bidder= GlobalStateValue(
        stack_type=TealType.bytes,
        default=Bytes(""),
        descr="Apostador mayor"
    )

    highest_bid= GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Apuesta mayor"
    )

    auction_end= GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Timestamp del final de la subasta"
    )

    asa_id= GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="ID del asset a subastar"
    )

app = Application("AuctionApp", state=MyState)

@app.create(bare=True)
def create() -> Expr:
    return app.initialize_global_state()

@app.external(authorize=Authorize.only(Global.creator_address()))
def opt_in(asset: abi.Asset) -> Expr:
    return Seq(
        Assert(app.state.asa_id.get() == Int(0)),
        app.state.asa_id.set(asset.asset_id()),
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.xfer_asset: asset.asset_id(),
            TxnField.asset_amount: Int(0),
            TxnField.fee: Int(0)
        })
    )

@app.external
def start_auction(
    length: abi.Uint64,
    starting_price: abi.Uint64,
    axfer: abi.AssetTransferTransaction
    ) -> Expr:
    return Seq(
        Assert(app.state.auction_end.get() == Int(0)),
        Assert(axfer.get().asset_receiver() == Global.current_application_address()),
        Assert(axfer.get().xfer_asset() == app.state.asa_id.get()),
        app.state.highest_bid.set(starting_price.get()),
        app.state.auction_end.set(Global.latest_timestamp()+length.get())
    )

# SubRutina reutilizable para enviar pagos de ALGO
def pay(receiver: Expr, amount: Expr) -> Expr:
    return InnerTxnBuilder.Execute({
        TxnField.type_enum: TxnType.Payment,
        TxnField.fee: Int(0),
        TxnField.receiver: receiver,
        TxnField.amount: amount
    })

# Funcion para ofertar
@app.external
def bid(payment: abi.PaymentTransaction, previous_winner: abi.Account) -> Expr:
    return Seq(
        Assert(Global.latest_timestamp() < app.state.auction_end.get()),
        # Check de la transaccion de pago
        Assert(payment.get().amount() > app.state.highest_bid.get()),
        Assert(payment.get().receiver() == Global.current_application_address()),
        Assert(Txn.sender() == payment.get().sender()),
        # Condicional para realizar la devolución si hay un postor previo
        If(
            app.state.highest_bidder.get() != Bytes(""),
            pay(app.state.highest_bidder.get(), app.state.highest_bid.get())
        ),
        app.state.highest_bid.set(payment.get().amount()),
        app.state.highest_bidder.set(payment.get().sender())
    )

# Metodo para que el ofertante ganador reclame el asset
@app.external
def claim_asset(asset: abi.Asset) -> Expr:
    return Seq(
        Assert(Global.latest_timestamp() >= app.state.auction_end.get()),
        Assert(Txn.sender() == app.state.highest_bidder.get()),
        # Transaccion interna de envío de asset
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_amount: Int(1),
            TxnField.xfer_asset: app.state.asa_id.get(),
            TxnField.asset_receiver: app.state.highest_bidder.get(),
            TxnField.fee: Int(0)
        })
    )

if __name__ == "__main__":
    app.build().export("./artifacts")
