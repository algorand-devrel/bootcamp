from beaker import *
from pyteal import *


class MyState:
    # Global State
    last_multiply = GlobalStateValue(TealType.uint64)
    last_sum = GlobalStateValue(
        stack_type=TealType.uint64,
        descr="Ultima suma",
        default=Int(999)
    )

    # Local State
    my_last_sum = LocalStateValue(
        stack_type=TealType.uint64,
        descr="Ultima suma local",
        default=Int(999)
    )

app = Application("Calculator", state=MyState).apply(
    unconditional_create_approval, initialize_global_state=True)

@app.external
def hello(name: abi.String, *, output: abi.String) -> Expr:
    return output.set(Concat(Bytes("Hola, "), name.get()))

@app.external
def difference(a: abi.Uint64, b: abi.Uint64, *, output: abi.Uint64) -> Expr:
    return (
        If(a.get() > b.get())
        .Then(output.set(a.get() - b.get()))
        .ElseIf(a.get() == b.get())
        .Then(output.set(Int(1337)))
        .Else(output.set(b.get() - a.get()))
    )

@app.external
def multiply(a: abi.Uint64, b: abi.Uint64, *, output: abi.Uint64) -> Expr:
    return Seq(
        app.state.last_multiply.set(a.get()*b.get()),
        output.set(a.get()*b.get())
    )

def internal_add(a: abi.Uint64, b: abi.Uint64) -> Expr:
    return a.get() + b.get()

@app.opt_in
def opt_in() -> Expr:
    return app.initialize_local_state()

@app.external
def add(
    p: abi.PaymentTransaction, 
    a: abi.Uint64,
    b: abi.Uint64, 
    acc: abi.Account,
    *, 
    output: abi.Uint64
    ) -> Expr:
    result = internal_add(a,b)
    return Seq(
        Assert(p.get().receiver() == Global.current_application_address()),
        Assert(p.get().amount() >= (Int(500000))),
        app.state.last_sum.set(result),
        app.state.my_last_sum[Txn.sender()].set(result),
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: Global.creator_address(),
            TxnField.amount: p.get().amount()/Int(2)
        }),
        output.set(result)
    )

@app.external
def read_global_sum(*, output: abi.Uint64) -> Expr:
    return output.set(app.state.last_sum.get())

@app.external
def read_local_sum(*, output: abi.Uint64) -> Expr:
    return output.set(app.state.my_last_sum[Txn.sender()].get())

if __name__ == "__main__":
    app.build().export("./artifacts")
