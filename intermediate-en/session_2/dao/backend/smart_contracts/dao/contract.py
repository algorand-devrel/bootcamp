import beaker
import pyteal as pt
from beaker.lib.storage import BoxMapping
from typing import Literal

byte32 = pt.abi.StaticArray[pt.abi.Byte, Literal[32]]
class Proposal(pt.abi.NamedTuple):
    name: pt.abi.Field[pt.abi.String]
    unit_name: pt.abi.Field[pt.abi.String]
    url: pt.abi.Field[pt.abi.String]
    hash: pt.abi.Field[byte32]

class DAOState:
    proposals = BoxMapping(key_type=pt.abi.Uint64, value_type=Proposal)

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
def add_proposal(proposal: Proposal) -> pt.Expr:
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

@app.external
def mint() -> pt.Expr:
    winning_proposal_id = pt.abi.Uint64()
    winning_proposal = Proposal()

    url = pt.abi.String()
    hash = pt.abi.make(byte32)
    name = pt.abi.String()
    unit_name = pt.abi.String()

    return pt.Seq(
        winning_proposal.url.store_into(url),
        winning_proposal.hash.store_into(hash),
        winning_proposal.name.store_into(name),
        winning_proposal.unit_name.store_into(unit_name),
        winning_proposal_id.set(app.state.winning_proposal.get()),
        app.state.proposals[winning_proposal_id].store_into(winning_proposal),
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetConfig,
                pt.TxnField.config_asset_total: pt.Int(1),
                pt.TxnField.config_asset_url: url.get(),
                pt.TxnField.config_asset_metadata_hash: hash.encode(),
                pt.TxnField.config_asset_name: name.get(),
                pt.TxnField.config_asset_unit_name: unit_name.get(),
            }
        )
    )
