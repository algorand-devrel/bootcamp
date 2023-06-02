from beaker import *
from pyteal import *


class DAOState:
    winning_proposal_votes = GlobalStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    winning_proposal = GlobalStateValue(stack_type=TealType.bytes, default=Bytes(""))

    proposal = LocalStateValue(stack_type=TealType.bytes)

    votes = LocalStateValue(stack_type=TealType.uint64)

    has_voted = LocalStateValue(stack_type=TealType.uint64, default=Int(0))


app = Application("LocalStorageDao", state=DAOState)


@app.create(bare=True)
def create() -> Expr:
    return app.initialize_global_state()

@app.opt_in(bare=True)
def opt_in() -> Expr:
    return Approve()


@app.external
def add_proposal(desc: abi.String) -> Expr:
    return Seq(
        Assert(app.state.proposal[Txn.sender()].get() == Int(0)),
        app.state.proposal[Txn.sender()].set(desc.get()),
    )


@app.external
def support(proposer: abi.Account) -> Expr:
    total_votes = ScratchVar(TealType.uint64)

    return Seq(
        Assert(app.state.has_voted[Txn.sender()].get() == Int(0)),
        total_votes.store(app.state.votes[proposer.address()] + Int(1)),
        app.state.votes[proposer.address()].set(total_votes.load()),
        If(total_votes.load() > app.state.winning_proposal_votes.get()).Then(
            app.state.winning_proposal_votes.set(total_votes.load()),
            app.state.winning_proposal.set(proposer.address()),
        ),
        app.state.has_voted[Txn.sender()].set(Int(1)),
    )


if __name__ == "__main__":
    app.build().export("./artifacts")
