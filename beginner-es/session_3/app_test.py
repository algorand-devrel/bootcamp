from algosdk import transaction
from algosdk.atomic_transaction_composer import (
    AtomicTransactionComposer,
    TransactionWithSigner,
)
from beaker import *

accounts = localnet.get_accounts()
creator = accounts.pop()
app_client = client.ApplicationClient(
    app=open("./artifacts/application.json").read(),
    client=localnet.get_algod_client(),
    signer=creator.signer,
)

def deploy() -> None:
    app_client.create()

def opt_in() -> None:
    atc = AtomicTransactionComposer()
    
    # Create ASA
    asa_create = TransactionWithSigner(
        txn=transaction.AssetCreateTxn(
            sender=creator.address,
            total=1,
            decimals=0,
            default_frozen=False,
            unit_name="BOOT",
            asset_name="ES BOOTCAMP COIN",
            sp=app_client.get_suggested_params(),
        ),
        signer=creator.signer,
    )

    atc.add_transaction(asa_create)
    tx_id = atc.execute(localnet.get_algod_client(), 3).tx_ids[0]
    asa = localnet.get_algod_client().pending_transaction_info(tx_id)["asset-index"]

    # Fund app with account MBR + ASA MBR
    app_client.fund(200_000)

    # Call opt_into_asset
    sp = app_client.get_suggested_params()
    sp.fee = sp.min_fee * 2
    app_client.call("opt_in", asset=asa, suggested_params=sp)
    return asa



# Tests para creación del contrato
def test_deploy_highest_bidder() -> None:
    deploy()
    assert app_client.get_global_state()["highest_bidder"] == ""

def test_deploy_highest_bid() -> None:
    deploy()
    assert app_client.get_global_state()["highest_bid"] == 0

def test_deploy_asa_id() -> None:
    deploy()
    assert app_client.get_global_state()["asa_id"] == 0

# Tests para el optin del contrato a asset
def test_optin() -> None:
    deploy()
    opt_in()
    assert len(app_client.client.account_info(app_client.app_addr)["assets"]) == 1 







    

    

    
