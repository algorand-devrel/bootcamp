from pathlib import Path

from algokit_utils import application_client
from beaker import Application, sandbox

from app import dao, minter


def deploy(app: Application, *, template_values: dict) -> int:
    app.build().export(Path(__file__).resolve().parent / f"./artifacts/{app.name}")

    accounts = sandbox.kmd.get_accounts()
    sender = accounts[0]

    app_client = application_client.ApplicationClient(
        algod_client=sandbox.get_algod_client(),
        app_spec=app.build(),
        sender=sender.address,
        signer=sender.signer,
        template_values=template_values,
    )

    app_client.create()

    return app_client.app_id


def deploy_minter() -> int:
    return deploy(minter, template_values={})


def deploy_dao() -> int:
    return deploy(dao, template_values={"MINTER_APP": deploy_minter()})


if __name__ == "__main__":
    deploy_dao()
