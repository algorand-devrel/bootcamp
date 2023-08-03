import dataclasses
from collections.abc import Callable

from algokit_utils import Account, ApplicationSpecification
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient
from beaker import Application

from smart_contracts.dao.contract import dao as dao_app
from smart_contracts.minter.contract import minter as minter_app


@dataclasses.dataclass
class SmartContract:
    app: Application
    deploy: Callable[
        [AlgodClient, IndexerClient, ApplicationSpecification, Account], None
    ] | None = None


# define contracts to build
contracts = [SmartContract(app=dao_app), SmartContract(app=minter_app)]
