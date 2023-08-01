import beaker
import pyteal as pt

from beaker.lib.storage import BoxMapping

from typing import Literal


# Currently:
#   String stored in box storage
#   That string can be anything
#
# What we want:
#   Datatype representing nft data
#   That nft data must be specific types
#
# ASA ARC3 Fields:
# URL: URL to the JSON/image data
# Name: Name of the asset
# Unit name: shorthand name/ticker for the asset
# Hash: Hash of the metadata in the URL
byte32 = pt.abi.StaticArray[pt.abi.Byte, Literal[32]]


class Proposal(pt.abi.NamedTuple):
    name: pt.abi.Field[pt.abi.String]
    url: pt.abi.Field[pt.abi.String]
    unit_name: pt.abi.Field[pt.abi.String]
    # byte[32]
    metadata_hash: pt.abi.Field[byte32]


class DAOState:
    # Box Storage
    # Unique ID for each proposal

    # A global counter for generating IDs
    current_proposal_id = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, default=pt.Int(0)
    )

    # Save the proposals in box storage, mapped to the ID
    proposals = BoxMapping(
        key_type=pt.abi.Uint64, value_type=Proposal, prefix=pt.Bytes("p-")
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
def add_proposal(proposal: Proposal) -> pt.Expr:
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
def vote(proposal_id: pt.abi.Uint64) -> pt.Expr:
    box_current_votes = app.state.votes[proposal_id]

    new_votes = pt.Btoi(box_current_votes.get()) + pt.Int(1)
    abi_new_votes = pt.abi.Uint64()

    winning_proposal = app.state.winning_proposal.get()
    abi_winning_proposal = pt.abi.Uint64()

    abi_winning_proposal_votes = app.state.votes[abi_winning_proposal]
    winning_proposal_votes = pt.Btoi(abi_winning_proposal_votes.get())

    return pt.Seq(
        abi_winning_proposal.set(winning_proposal),
        abi_new_votes.set(new_votes),
        # If new amount of votes for the given proposal is more than the winning proposal
        pt.If(new_votes > winning_proposal_votes).Then(
            # Then set the winning proposal to the given proposal
            app.state.winning_proposal.set(proposal_id.get())
        ),
        # Update proposal vote count
        app.state.votes[proposal_id].set(abi_new_votes),
    )


@app.external
def mint() -> pt.Expr:
    # Read the winning proposal
    # Get the proposal data structure for the winning proposal
    # Create an asset based on that data structure
    winning_proposal_id = pt.abi.Uint64()
    winning_proposal = Proposal()

    url = pt.abi.String()
    name = pt.abi.String()
    unit_name = pt.abi.String()
    metdata_hash = pt.abi.make(byte32)
    return pt.Seq(
        winning_proposal_id.set(app.state.winning_proposal.get()),
        app.state.proposals[winning_proposal_id].store_into(winning_proposal),
        winning_proposal.url.store_into(url),
        winning_proposal.name.store_into(name),
        winning_proposal.unit_name.store_into(unit_name),
        winning_proposal.metadata_hash.store_into(metdata_hash),
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetConfig,
                pt.TxnField.config_asset_total: pt.Int(1),
                pt.TxnField.config_asset_url: url.get(),
                pt.TxnField.config_asset_name: name.get(),
                pt.TxnField.config_asset_unit_name: unit_name.get(),
                pt.TxnField.config_asset_metadata_hash: metdata_hash.encode(),
            }
        ),
    )
