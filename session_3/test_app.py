from beaker import *
from algosdk.dryrun_results import DryrunResponse
from algosdk import transaction
from algosdk.encoding import encode_address
from algosdk.atomic_transaction_composer import (
    TransactionWithSigner,
    AtomicTransactionComposer,
)
import pytest

##########
# fixtures
##########


@pytest.fixture(scope="module")
def create_app():
    global accounts
    global creator_acct
    global app_client
    accounts = sorted(
        sandbox.get_accounts(),
        key=lambda a: sandbox.clients.get_algod_client().account_info(a.address)[
            "amount"
        ],
    )

    creator_acct = accounts.pop()

    app_client = client.ApplicationClient(
        app=open("./application.json").read(),
        client=sandbox.get_algod_client(),
        signer=creator_acct.signer,
    )

    app_client.create()


@pytest.fixture(scope="module")
def opt_in():
    global asa
    atc = AtomicTransactionComposer()

    # Create ASA
    asa_create = TransactionWithSigner(
        txn=transaction.AssetCreateTxn(
            sender=creator_acct.address,
            total=1,
            decimals=0,
            default_frozen=False,
            unit_name="BASA",
            asset_name="Beaker ASA",
            sp=app_client.get_suggested_params(),
        ),
        signer=creator_acct.signer,
    )

    atc.add_transaction(asa_create)
    tx_id = atc.execute(sandbox.get_algod_client(), 3).tx_ids[0]
    asa = sandbox.get_algod_client().pending_transaction_info(tx_id)["asset-index"]

    # Fund app with account MBR + ASA MBR
    app_client.fund(200_000)

    # Call opt_into_asset
    sp = app_client.get_suggested_params()
    sp.fee = sp.min_fee * 2
    app_client.call("opt_into_asset", asset=asa, suggested_params=sp)


@pytest.fixture(scope="module")
def start_auction():
    sp = app_client.get_suggested_params()

    axfer = TransactionWithSigner(
        txn=transaction.AssetTransferTxn(
            sender=creator_acct.address,
            receiver=app_client.app_addr,
            index=asa,
            amt=1,
            sp=sp,
        ),
        signer=creator_acct.signer,
    )

    app_client.call("start_auction", axfer=axfer, starting_price=10_000, length=36_000)


@pytest.fixture(scope="module")
def send_first_bid():
    global first_bidder
    first_bidder = accounts.pop()

    sp = app_client.get_suggested_params()

    pay_txn = TransactionWithSigner(
        txn=transaction.PaymentTxn(
            sender=first_bidder.address, receiver=app_client.app_addr, amt=20_000, sp=sp
        ),
        signer=first_bidder.signer,
    )

    app_client.call(
        "bid",
        payment=pay_txn,
        previous_bidder=first_bidder.address,
        signer=first_bidder.signer,
    )


@pytest.fixture(scope="module")
def send_second_bid():
    global second_bidder
    global first_bidder_amount
    second_bidder = accounts.pop()

    sp = app_client.get_suggested_params()
    sp.fee = sp.min_fee * 2
    first_bidder_amount = app_client.client.account_info(first_bidder.address)["amount"]

    pay_txn = TransactionWithSigner(
        txn=transaction.PaymentTxn(
            sender=second_bidder.address,
            receiver=app_client.app_addr,
            amt=30_000,
            sp=sp,
        ),
        signer=second_bidder.signer,
    )

    app_client.call(
        "bid",
        payment=pay_txn,
        previous_bidder=first_bidder.address,
        signer=second_bidder.signer,
    )


@pytest.fixture(scope="module")
def end_auction():
    sp = app_client.get_suggested_params()
    sp.fee = sp.min_fee * 2

    atc = AtomicTransactionComposer()

    app_client.add_method_call(
        atc=atc,
        method="end_auction",
        sender=creator_acct.address,
        suggested_params=sp,
        signer=creator_acct.signer,
    )

    dr_req = transaction.create_dryrun(
        app_client.client,
        atc.gather_signatures(),
        latest_timestamp=2524608000,  # <- January 1, 2050
    )
    dr_res = DryrunResponse(app_client.client.dryrun(dr_req))
    global global_delta

    global_delta = dr_res.txns[0].global_delta


@pytest.fixture(scope="module")
def claim_bid():
    sp = app_client.get_suggested_params()
    sp.fee = sp.min_fee * 2
    app_client.call("claim_bid", suggested_params=sp)


@pytest.fixture(scope="module")
def claim_asset():
    atc = AtomicTransactionComposer()
    bidder_opt_in = TransactionWithSigner(
        txn=transaction.AssetTransferTxn(
            sender=second_bidder.address,
            receiver=second_bidder.address,
            index=asa,
            amt=0,
            sp=app_client.get_suggested_params(),
        ),
        signer=second_bidder.signer,
    )

    atc.add_transaction(bidder_opt_in)

    sp = app_client.get_suggested_params()
    sp.fee = sp.min_fee * 2

    app_client.add_method_call(
        atc=atc,
        method="claim_asset",
        asset=asa,
        asset_creator=creator_acct.address,
        suggested_params=sp,
        sender=second_bidder.address,
        signer=second_bidder.signer,
    ),

    atc.execute(sandbox.get_algod_client(), 3)


##############
# create tests
##############


@pytest.mark.create
def test_create_highest_bidder(create_app):
    assert app_client.get_global_state()["highest_bidder"] == ""


@pytest.mark.create
def test_create_highest_bid(create_app):
    assert app_client.get_global_state()["highest_bid"] == 0


@pytest.mark.create
def test_create_auction_end(create_app):
    assert app_client.get_global_state()["auction_end"] == 0


#############
# OptIn tests
#############


@pytest.mark.opt_in
def test_opt_in(create_app, opt_in):
    assert len(app_client.client.account_info(app_client.app_addr)["assets"]) == 1


#####################
# start_auction tests
#####################


@pytest.mark.start_auction
def test_start_auction_end(create_app, opt_in, start_auction):
    assert app_client.get_global_state()["auction_end"] != 0


@pytest.mark.start_auction
def test_start_auction_highest_bid(create_app, opt_in, start_auction):
    assert app_client.get_global_state()["highest_bid"] == 10_000


#################
# first_bid tests
#################


@pytest.mark.first_bid
def test_first_bid_highest_bid(create_app, opt_in, start_auction, send_first_bid):
    assert app_client.get_global_state()["highest_bid"] == 20_000


@pytest.mark.first_bid
def test_first_bid_highest_bidder(create_app, opt_in, start_auction, send_first_bid):
    addr = bytes.fromhex(app_client.get_global_state()["highest_bidder"])
    assert encode_address(addr) == first_bidder.address


##################
# second_bid tests
##################


@pytest.mark.second_bid
def test_second_bid_highest_bid(
    create_app, opt_in, start_auction, send_first_bid, send_second_bid
):
    assert app_client.get_global_state()["highest_bid"] == 30_000


@pytest.mark.second_bid
def test_second_bid_highest_bidder(
    create_app, opt_in, start_auction, send_first_bid, send_second_bid
):
    addr = bytes.fromhex(app_client.get_global_state()["highest_bidder"])
    assert encode_address(addr) == second_bidder.address


@pytest.mark.second_bid
def test_second_bid_first_bidder_balance(
    create_app, opt_in, start_auction, send_first_bid, send_second_bid
):
    assert (
        app_client.client.account_info(first_bidder.address)["amount"]
        == first_bidder_amount + 20_000
    )


@pytest.mark.second_bid
def test_second_bid_app_balance(
    create_app, opt_in, start_auction, send_first_bid, send_second_bid
):
    assert (
        app_client.client.account_info(app_client.app_addr)["amount"]
        == 30_000 + 200_000
    )


#################
# claim_bid tests
#################


@pytest.mark.claim_bid
def test_claim_bid(
    create_app, opt_in, start_auction, send_first_bid, send_second_bid, claim_bid
):
    assert app_client.client.account_info(app_client.app_addr)["amount"] == 200_000


###################
# claim_asset tests
###################


@pytest.mark.claim_asset
def test_claim_asset(
    create_app,
    opt_in,
    start_auction,
    send_first_bid,
    send_second_bid,
    claim_bid,
    claim_asset,
):
    assert app_client.client.account_info(app_client.app_addr)["assets"] == []
