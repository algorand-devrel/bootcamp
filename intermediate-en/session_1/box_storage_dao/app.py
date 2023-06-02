from beaker import *
from beaker.lib.storage import BoxMapping
from pyteal import *


class DAOState:
    # Global Storage
    winning_proposal_votes = GlobalStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    winning_proposal = GlobalStateValue(stack_type=TealType.bytes, default=Bytes(""))

    # Box Storage
    proposals = BoxMapping(
        key_type=abi.Address, value_type=abi.String, prefix=Bytes("p-")
    )

    votes = BoxMapping(key_type=abi.Address, value_type=abi.Uint64, prefix=Bytes("v-"))

    has_voted = BoxMapping(
        key_type=abi.Address, value_type=abi.Bool, prefix=Bytes("h-")
    )


app = Application("BoxStorageDAO", state=DAOState)


@app.create(bare=True)
def create() -> Expr:
    return app.initialize_global_state()


@app.external
def add_proposal(desc: abi.String) -> Expr:
    return Seq(
        # Check if the proposal already exists
        Assert(app.state.proposals[Txn.sender()].exists() == Int(0)),
        # Not using .get() here because desc is already a abi.String
        app.state.proposals[Txn.sender()].set(desc),
    )


@app.external
def support(proposer: abi.Address) -> Expr:
    total_votes = abi.Uint64()
    current_votes = abi.Uint64()
    true_value = abi.Bool()
    zero_val = abi.Uint64()

    return Seq(
        # Make sure we haven't voted yet
        Assert(app.state.has_voted[Txn.sender()].exists() == Int(0)),
        # Get current vote count
        If(app.state.votes[proposer].exists()).Then(app.state.votes[proposer].store_into(current_votes)),
        # Increment and save total vote count
        total_votes.set(current_votes.get() + Int(1)),
        app.state.votes[proposer].set(total_votes),
        # Check if this proposal is now winning
        If(total_votes.get() > app.state.winning_proposal_votes.get()).Then(
            app.state.winning_proposal_votes.set(total_votes.get()),
            app.state.winning_proposal.set(proposer.get()),
        ),
        # Set has_voted to true
        true_value.set(True),
        app.state.has_voted[Txn.sender()].set(true_value),
    )


if __name__ == "__main__":
    app.build().export("./artifacts")
