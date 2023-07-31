from pathlib import Path

import beaker
import pyteal as pt

from utils import build


class DAOState:
    # Counter keeping track of the number of proposals
    # Used for uniquely identifying proposal
    current_proposal_id = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )

    # proposals["p-" + proposal_id] = The content of the given proposal
    # When key is just proposal_id => key is a number
    # Prefix to make it not just a number, but the prefix + number
    proposals = beaker.ReservedGlobalStateValue(
        stack_type=pt.TealType.bytes, max_keys=31, prefix="p-"
    )

    # votes["v-" + proposal_id] = The number of votes the given proposal has
    # When key is just proposal_id => key is a number
    # Prefix to make it not just a number, but the prefix + number
    votes = beaker.ReservedGlobalStateValue(
        stack_type=pt.TealType.uint64, max_keys=31, prefix="v-"
    )

    # Indicates which proposal currently has the most votes
    winning_proposal = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )


app = beaker.Application("DAO", state=DAOState)


@app.create
def create() -> pt.Expr:
    return app.initialize_global_state()


@app.external
def add_proposal(proposal: pt.abi.String) -> pt.Expr:
    # Get the current proposal ID
    proposal_id = pt.Itob(app.state.current_proposal_id.get())
    new_id = app.state.current_proposal_id.get() + pt.Int(1)

    return pt.Seq(
        # Set the value of the current proposal ID to the given proposal
        app.state.proposals[proposal_id].set(proposal.get()),
        # Increment the current proposal ID
        app.state.current_proposal_id.set(new_id),
    )


@app.external
def vote(proposal_id: pt.abi.Uint64) -> pt.Expr:
    proposal_id_key = pt.Itob(proposal_id.get())
    current_votes = app.state.votes[proposal_id_key].get()
    # Increment votes for given proposal
    new_votes = current_votes + pt.Int(1)

    winning_proposal = app.state.winning_proposal.get()
    winning_proposal_votes = app.state.votes[pt.Itob(winning_proposal)].get()

    return pt.Seq(
        # If new amount of votes for the given proposal 
        # is more than the winning proposal
        pt.If(new_votes > winning_proposal_votes).Then(
            # Then set the winning proposal to the given proposal
            app.state.winning_proposal.set(proposal_id.get())
        ),
        # Update proposal vote count
        app.state.votes[proposal_id_key].set(new_votes),
    )


if __name__ == "__main__":
    root_path = Path(__file__).parent
    build(root_path / "artifacts", app)
