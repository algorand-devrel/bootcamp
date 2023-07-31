from pathlib import Path

import beaker
import pyteal as pt

from utils import build


class DAOState:
    # Local Storage
    # Map the proposals to a specific address

    # Save the proposal to the specific account
    proposal = beaker.LocalStateValue(stack_type=pt.TealType.bytes)

    # Votes for the account's proposal
    votes = beaker.LocalStateValue(stack_type=pt.TealType.uint64)

    # Indicates which proposal currently has the most votes
    winning_proposal = beaker.GlobalStateValue(
        stack_type=pt.TealType.bytes, default=pt.Bytes("")
    )


app = beaker.Application("DAO", state=DAOState)


@app.create
def create() -> pt.Expr:
    return app.initialize_global_state()


# In local state:
# proposal[txn.sender] = given proposal
# votes[txn.sender] = 0
@app.opt_in
def add_proposal(proposal: pt.abi.String) -> pt.Expr:
    return pt.Seq(
        # Set proposal to given proposal content
        app.state.proposal[pt.Txn.sender()].set(proposal.get()),
        # Set votes to zero
        app.state.votes[pt.Txn.sender()].set(pt.Int(0)),
    )


@app.external
def vote(proposer: pt.abi.Account) -> pt.Expr:
    current_votes = app.state.votes[proposer.address()].get()
    # Increment votes for given proposal
    new_votes = current_votes + pt.Int(1)

    winning_proposal = app.state.winning_proposal.get()
    winning_proposal_votes = app.state.votes[winning_proposal].get()

    return pt.Seq(
        # If new amount of votes for the given proposal is more 
        # than the winning proposal
        pt.If(new_votes > winning_proposal_votes).Then(
            # Then set the winning proposal to the given proposal
            app.state.winning_proposal.set(proposer.address())
        ),
        # Update proposal vote count
        app.state.votes[proposer.address()].set(new_votes),
    )


if __name__ == "__main__":
    root_path = Path(__file__).parent
    build(root_path / "artifacts", app)
