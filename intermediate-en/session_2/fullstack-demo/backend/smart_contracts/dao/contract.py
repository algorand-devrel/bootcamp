import beaker
import pyteal as pt
from beaker.lib.storage import BoxMapping


class DAOState:
    proposals = BoxMapping(key_type=pt.abi.Uint64, value_type=pt.abi.String)

    votes = BoxMapping(key_type=pt.abi.Address, value_type=pt.abi.Uint64)

    current_proposal_id = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )

    winning_proposal = beaker.GlobalStateValue(
        stack_type=pt.TealType.bytes, default=pt.Bytes("")
    )


app = beaker.Application("dao", state=DAOState)


@app.create
def create() -> pt.Expr:
    return app.initialize_global_state()


@app.external
def add_proposal(proposal: pt.abi.String) -> pt.Expr:
    abi_zero = pt.abi.Uint64()
    return pt.Seq(
        abi_zero.set(pt.Int(0)),
        app.state.proposals[pt.Txn.sender()].set(proposal),
        app.state.votes[pt.Txn.sender()].set(abi_zero),
    )


@app.external
def vote(proposer: pt.abi.Address) -> pt.Expr:
    abi_current_votes = app.state.votes[proposer]
    new_votes = pt.Btoi(abi_current_votes.get()) + pt.Int(1)

    winning_proposal = app.state.winning_proposal.get()
    winning_proposal_votes = pt.Btoi(app.state.votes[winning_proposal].get())

    abi_new_votes = pt.abi.Uint64()

    return pt.Seq(
        pt.If(new_votes > winning_proposal_votes).Then(
            app.state.winning_proposal.set(proposer.get())
        ),
        abi_new_votes.set(new_votes),
        app.state.votes[proposer].set(abi_new_votes),
    )
