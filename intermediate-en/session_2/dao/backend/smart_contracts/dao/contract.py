import beaker
import pyteal as pt

from beaker.lib.storage import BoxMapping


class DAOState:
    # Box Storage
    # Unique ID for each proposal

    # A global counter for generating IDs
    current_proposal_id = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )

    # Save the proposals in box storage, mapped to the ID
    proposals = BoxMapping(
        key_type=pt.abi.Uint64, value_type=pt.abi.String, prefix=pt.Bytes("p-")
    )

    # Votes for the id's proposal
    votes = BoxMapping(
        key_type=pt.abi.Uint64, value_type=pt.abi.Uint64, prefix=pt.Bytes("v-")
    )

    # Indicates which proposal currently has the most votes
    winning_proposal = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )


app = beaker.Application("DAO", state=DAOState)


@app.create
def create() -> pt.Expr:
    return app.initialize_global_state()


# In box storage:
# proposal[id] = given proposal
# votes[id] = 0
@app.opt_in
def add_proposal(proposal: pt.abi.String) -> pt.Expr:
    proposal_id = app.state.current_proposal_id.get()
    new_id = proposal_id + pt.Int(1)
    abi_proposal_id = pt.abi.Uint64()
    abi_zero = pt.abi.Uint64()

    return pt.Seq(
        abi_proposal_id.set(proposal_id),
        abi_zero.set(pt.Int(0)),
        # Set proposal to given proposal content
        app.state.proposals[abi_proposal_id].set(proposal),
        # Set votes to zero
        app.state.votes[abi_proposal_id].set(abi_zero),
        app.state.current_proposal_id.set(new_id),
    )


@app.external
def vote(proposer: pt.abi.Account) -> pt.Expr:
    current_votes = app.state.votes[proposer.address()].get()
    # Increment votes for given proposal
    new_votes = current_votes + pt.Int(1)

    winning_proposal = app.state.winning_proposal.get()
    winning_proposal_votes = app.state.votes[winning_proposal].get()

    return pt.Seq(
        # If new amount of votes for the given proposal is more than the winning proposal
        pt.If(new_votes > winning_proposal_votes).Then(
            # Then set the winning proposal to the given proposal
            app.state.winning_proposal.set(proposer.address())
        ),
        # Update proposal vote count
        app.state.votes[proposer.address()].set(new_votes),
    )
