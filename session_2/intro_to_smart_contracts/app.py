from beaker import *
from pyteal import *


class ApplicationState:
    counter = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))


app = Application("HelloWorld", state=ApplicationState)


@app.create(bare=True)
def create() -> Expr:
    return app.initialize_global_state()


@app.external
def hello(name: abi.String, *, output: abi.String) -> Expr:
    return output.set(Concat(Bytes("Hello, "), name.get()))


@app.delete(bare=True, authorize=Authorize.only(Global.creator_address()))
def delete() -> Expr:
    return Approve()


@app.external
def logger(a: abi.String, b: abi.String, *, output: abi.String) -> Expr:
    return Seq(
        [
            Log(a.get()),
            Log(b.get()),
            output.set(Concat(a.get(), b.get())),
        ]
    )


@app.external
def add(a: abi.Uint64, b: abi.Uint64, *, output: abi.Uint64) -> Expr:
    return output.set(a.get() + b.get())


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
def increment() -> Expr:
    return app.state.counter.set(app.state.counter.get() + Int(1))


if __name__ == "__main__":
    app.build().export("./artifacts")
