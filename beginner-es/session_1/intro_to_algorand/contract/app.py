#!/usr/bin/env python3

from typing import Final

from beaker import *
from pyteal import *


class CounterState:
    counter: Final[GlobalStateValue] = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Counter",
    )

    last_caller_address: Final[GlobalStateValue] = GlobalStateValue(
        stack_type=TealType.bytes,
        default=Global.creator_address(),
        descr="Last caller address",
    )

    last_caller_name: Final[GlobalStateValue] = GlobalStateValue(
        stack_type=TealType.bytes,
        descr="Last caller name",
    )




app = Application("Counter", state=CounterState)


@app.create
def create(name: abi.String) -> Expr:
    return Seq(
        # Set all global state to default values
        app.initialize_global_state(),
        # Save caller name
        app.state.last_caller_name.set(name.get()),
    )

@app.external
def increment(name: abi.String) -> Expr:
    return Seq(
        # Increment the counter
        app.state.counter.set(app.state.counter + Int(1)),
        # Save caller address
        app.state.last_caller_address.set(Txn.sender()),
        # Save caller name
        app.state.last_caller_name.set(name.get()),
    )

if __name__ == "__main__":
    app.build().export()
