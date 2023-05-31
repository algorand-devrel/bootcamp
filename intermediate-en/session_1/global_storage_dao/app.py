from beaker import *
from pyteal import *


class DAOState:
    current_proposal_id = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    winning_proposal_votes = GlobalStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    winning_proposal = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    proposals = ReservedGlobalStateValue(stack_type=TealType.bytes, max_keys=30)

    votes = ReservedGlobalStateValue(stack_type=TealType.uint64, max_keys=30)


app = Application("GlobalStorageDAO", state=DAOState)


@app.create(bare=True)
def create() -> Expr:
    return app.initialize_global_state()


@app.external
def add_proposal(desc: abi.String) -> Expr:
    return Seq(
        app.state.proposals[Itob(app.state.current_proposal_id.get())].set(desc.get()),
        app.state.current_proposal_id.set(app.state.current_proposal_id.get() + Int(1)),
    )


@app.external
def support(proposal_id: abi.Uint64) -> Expr:
    total_votes = ScratchVar(TealType.uint64)

    return Seq(
        total_votes.store(app.state.votes[Itob(proposal_id.get())] + Int(1)),
        app.state.votes[Itob(proposal_id.get())].set(total_votes.load()),
        If(total_votes.load() > app.state.winning_proposal_votes.get()).Then(
            app.state.winning_proposal_votes.set(total_votes.load()),
            app.state.winning_proposal.set(proposal_id.get()),
        ),
    )


if __name__ == "__main__":
    app.build().export("./artifacts")
