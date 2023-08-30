import beaker
import pyteal as pt


class estados:
    asa_id = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64,
        default=pt.Int(0),
        descr="Este es el ID del asset a subastarse, si es cero, la subasta aun no inicia.",
    )
    auction_end = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64,
        default=pt.Int(0),
        descr="Duracion de la subasta, si es cero, la subasta aun no ha iniciado",
    )
    highest_bid = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64,
        default=pt.Int(0),
        descr="Apuesta mayor hasta el momento",
    )
    winner = beaker.GlobalStateValue(
        stack_type=pt.TealType.bytes,
        default=pt.Bytes(""),
        descr="Cuenta del apostador mayor, ganador hasta ese momento, si es vacio, no hay ganador aún",
    )


app = beaker.Application("auction", state=estados)


@app.create(bare=True)
def create() -> pt.Expr:
    return app.initialize_global_state()


@app.external
def optin_to_asset(
    payment_to_contract: pt.abi.PaymentTransaction, asset: pt.abi.Asset
) -> pt.Expr:
    return pt.Seq(
        pt.Assert(
            payment_to_contract.get().receiver()
            == pt.Global.current_application_address()
        ),
        app.state.asa_id.set(asset.asset_id()),
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetTransfer,
                pt.TxnField.asset_receiver: pt.Global.current_application_address(),
                pt.TxnField.asset_amount: pt.Int(0),
                pt.TxnField.xfer_asset: asset.asset_id(),
                pt.TxnField.fee: pt.Int(0),
            }
        ),
    )


@app.external
def start(
    length: pt.abi.Uint64, min: pt.abi.Uint64, axfer: pt.abi.AssetTransferTransaction
) -> pt.Expr:
    return pt.Seq(
        app.state.highest_bid.set(min.get()),
        app.state.auction_end.set(pt.Global.latest_timestamp() + length.get()),
    )


@app.external
def bid(payment: pt.abi.PaymentTransaction, prewinner: pt.abi.Account) -> pt.Expr:
    return pt.Seq(
        # Verificar que la nueva apuesta sea mayor que la ultima
        pt.Assert(payment.get().amount() > app.state.highest_bid.get()),
        pt.If(
            # Si elganador previo no es vacio
            app.state.winner.get() != pt.Bytes(""),
            # Devuelve su apuesta al ultimo apostador mayor
            pt.InnerTxnBuilder.Execute(
                {
                    pt.TxnField.type_enum: pt.TxnType.Payment,
                    pt.TxnField.receiver: app.state.winner.get(),
                    pt.TxnField.amount: app.state.highest_bid.get(),
                    pt.TxnField.fee: pt.Int(0),
                }
            ),
        ),
        # Guardar el nuevo apostador mayor
        app.state.winner.set(payment.get().sender()),
        # Guardar la nueva apuesta mayor
        app.state.highest_bid.set(payment.get().amount()),
    )


@app.external
def claim_asset(asset: pt.abi.Asset) -> pt.Expr:
    return pt.Seq(
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetTransfer,
                pt.TxnField.asset_receiver: app.state.winner.get(),
                pt.TxnField.asset_amount: pt.Int(1),
                pt.TxnField.xfer_asset: app.state.asa_id.get(),
                pt.TxnField.fee: pt.Int(0),
            }
        )
    )


@app.external
def claim_bid() -> pt.Expr:
    return pt.Seq(
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.Payment,
                pt.TxnField.receiver: pt.Global.creator_address(),
                pt.TxnField.amount: app.state.highest_bid.get(),
                pt.TxnField.fee: pt.Int(0),
            }
        )
    )


@app.external
def get_time(*, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(pt.Global.latest_timestamp())


