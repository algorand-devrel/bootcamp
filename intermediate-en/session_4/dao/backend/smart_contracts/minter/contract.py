import beaker
import pyteal as pt


from typing import Literal


byte32 = pt.abi.StaticArray[pt.abi.Byte, Literal[32]]
class Proposal(pt.abi.NamedTuple):
    name: pt.abi.Field[pt.abi.String]
    url: pt.abi.Field[pt.abi.String]
    unit_name: pt.abi.Field[pt.abi.String]
    # byte[32]
    metadata_hash: pt.abi.Field[byte32]

minter = beaker.Application("Minter")

@minter.external
def mint_proposal(proposal: Proposal, *, output: pt.abi.Uint64) -> pt.Expr:
    url = pt.abi.String()
    name = pt.abi.String()
    unit_name = pt.abi.String()
    metdata_hash = pt.abi.make(byte32)
    return pt.Seq(
        proposal.url.store_into(url),
        proposal.name.store_into(name),
        proposal.unit_name.store_into(unit_name),
        proposal.metadata_hash.store_into(metdata_hash),
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetConfig,
                pt.TxnField.config_asset_total: pt.Int(1),
                pt.TxnField.config_asset_url: url.get(),
                pt.TxnField.config_asset_name: name.get(),
                pt.TxnField.config_asset_unit_name: unit_name.get(),
                pt.TxnField.config_asset_metadata_hash: metdata_hash.encode(),
                pt.TxnField.fee: pt.Int(0),
            }
        ),
        output.set(pt.InnerTxn.created_asset_id())
    )
