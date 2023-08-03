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

    # App ID of the miner contract
    minter_app_id = beaker.GlobalStateValue(stack_type=pt.TealType.uint64)


dao = beaker.Application("DAO", state=DAOState)
minter = beaker.Application("Minter")


@dao.create()
def create(minter_app_id: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        dao.initialize_global_state(), 
        dao.state.minter_app_id.set(minter_app_id.get())
    )


# In box storage:
# proposal[id] = given proposal
# votes[id] = 0
@dao.external
def add_proposal(proposal: Proposal) -> pt.Expr:
    proposal_id = dao.state.current_proposal_id.get()
    new_id = proposal_id + pt.Int(1)
    abi_proposal_id = pt.abi.Uint64()
    abi_zero = pt.abi.Uint64()

    return pt.Seq(
        abi_proposal_id.set(proposal_id),
        abi_zero.set(pt.Int(0)),
        # Set proposal to given proposal content
        dao.state.proposals[abi_proposal_id].set(proposal),
        # Set votes to zero
        dao.state.votes[abi_proposal_id].set(abi_zero),
        dao.state.current_proposal_id.set(new_id),
    )


@dao.external
def vote(proposal_id: pt.abi.Uint64) -> pt.Expr:
    box_current_votes = dao.state.votes[proposal_id]

    new_votes = pt.Btoi(box_current_votes.get()) + pt.Int(1)
    abi_new_votes = pt.abi.Uint64()

    winning_proposal = dao.state.winning_proposal.get()
    abi_winning_proposal = pt.abi.Uint64()

    abi_winning_proposal_votes = dao.state.votes[abi_winning_proposal]
    winning_proposal_votes = pt.Btoi(abi_winning_proposal_votes.get())

    return pt.Seq(
        abi_winning_proposal.set(winning_proposal),
        abi_new_votes.set(new_votes),
        # If new amount of votes for the given proposal is 
        # more than the winning proposal
        pt.If(new_votes > winning_proposal_votes).Then(
            # Then set the winning proposal to the given proposal
            dao.state.winning_proposal.set(proposal_id.get())
        ),
        # Update proposal vote count
        dao.state.votes[proposal_id].set(abi_new_votes),
    )

@dao.external
def mint(minter_app_ref: pt.abi.Application, *, output: pt.abi.Uint64) -> pt.Expr:
    winning_proposal_id = dao.state.winning_proposal.get()
    abi_winning_proposal_id = pt.abi.Uint64()
    winning_proposal = Proposal()
    return pt.Seq(
        abi_winning_proposal_id.set(winning_proposal_id),
        dao.state.proposals[abi_winning_proposal_id].store_into(winning_proposal),
        pt.InnerTxnBuilder.ExecuteMethodCall(
            app_id=dao.state.minter_app_id.get(),
            method_signature=f"mint_proposal({Proposal().type_spec()})uint64",
            args=[winning_proposal]
        ),
        output.set(pt.Btoi(pt.Suffix(pt.InnerTxn.last_log(), pt.Int(4))))
    )
