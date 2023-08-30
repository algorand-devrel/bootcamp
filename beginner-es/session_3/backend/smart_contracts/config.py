import dataclasses
import importlib
from collections.abc import Callable
from pathlib import Path

from algokit_utils import Account, ApplicationSpecification
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient
from beaker import Application


@dataclasses.dataclass
class SmartContract:
    app: Application
    deploy: Callable[
        [AlgodClient, IndexerClient, ApplicationSpecification, Account], None
    ] | None = None


def import_contract(folder: Path) -> Application:
    """Imports the contract from a folder if it exists."""
    try:
        contract_module = importlib.import_module(
            f"{folder.parent.name}.{folder.name}.contract"
        )
        return contract_module.app
    except ImportError as e:
        raise Exception(f"Contract not found in {folder}") from e


def import_deploy_if_exists(
    folder: Path,
) -> (
    Callable[[AlgodClient, IndexerClient, ApplicationSpecification, Account], None]
    | None
):
    """Imports the deploy function from a folder if it exists."""
    try:
        deploy_module = importlib.import_module(
            f"{folder.parent.name}.{folder.name}.deploy_config"
        )
        return deploy_module.deploy
    except ImportError:
        return None


def has_contract_file(directory: Path) -> bool:
    """Checks whether the directory contains contract.py file."""
    return (directory / "contract.py").exists()


# define contracts to build and/or deploy
base_dir = Path("smart_contracts")
contracts = [
    SmartContract(app=import_contract(folder), deploy=import_deploy_if_exists(folder))
    for folder in base_dir.iterdir()
    if folder.is_dir() and has_contract_file(folder)
]

## Comment the above and uncomment the below and define contracts manually if you want to build and specify them
## manually otherwise the above code will always include all contracts under contract.py file for any subdirectory
## in the smart_contracts directory. Optionally it will also grab the deploy function from deploy_config.py if it exists.

# contracts = []
