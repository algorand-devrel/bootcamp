from beaker import *
from auction import Auction
from algosdk.dryrun_results import DryrunResponse
from algosdk.future import transaction
from algosdk.encoding import encode_address
from algosdk.atomic_transaction_composer import (
    TransactionWithSigner,
    AtomicTransactionComposer,
)
import pytest
from beaker.client.state_decode import decode_state

##########
# fixtures
##########


@pytest.fixture(scope="module")
def create_app():
    global accounts
    global creator_acct
    global app_client

    # Create logic goes here



@pytest.fixture(scope="module")
def opt_in():
    global asa

    # opt in logic goes here
    


@pytest.fixture(scope="module")
def start_auction():
    # start_auction logic goes here


@pytest.fixture(scope="module")
def send_first_bid():
    global first_bidder
    # first bid logic goes here


@pytest.fixture(scope="module")
def send_second_bid():
    global second_bidder
    global first_bidder_amount

    # Second bid logic goes here

@pytest.fixture(scope="module")
def claim_bid():
    # claim_bid logic goes here


@pytest.fixture(scope="module")
def claim_asset():
    # claim_asset logic goes here


##############
# create tests
##############


@pytest.mark.create
def test_create_highest_bidder(create_app):
    assert app_client.get_application_state()["highest_bidder"] == ""


@pytest.mark.create
def test_create_highest_bid(create_app):
    assert app_client.get_application_state()["highest_bid"] == 0


@pytest.mark.create
def test_create_auction_end(create_app):
    assert app_client.get_application_state()["auction_end"] == 0


#############
# OptIn tests
#############


@pytest.mark.opt_in
def test_opt_in(create_app, opt_in):
    pass


#####################
# start_auction tests
#####################


@pytest.mark.start_auction
def test_start_auction_end(create_app, opt_in, start_auction):
    assert app_client.get_application_state()["auction_end"] != 0


@pytest.mark.start_auction
def test_start_auction_highest_bid(create_app, opt_in, start_auction):
    assert app_client.get_application_state()["highest_bid"] == 10_000


#################
# first_bid tests
#################


@pytest.mark.first_bid
def test_first_bid_highest_bid(create_app, opt_in, start_auction, send_first_bid):
    assert app_client.get_application_state()["highest_bid"] == 20_000


@pytest.mark.first_bid
def test_first_bid_highest_bidder(create_app, opt_in, start_auction, send_first_bid):
    addr = bytes.fromhex(app_client.get_application_state()["highest_bidder"])
    assert encode_address(addr) == first_bidder.address


##################
# second_bid tests
##################


@pytest.mark.second_bid
def test_second_bid_highest_bid(
    create_app, opt_in, start_auction, send_first_bid, send_second_bid
):
    assert app_client.get_application_state()["highest_bid"] == 30_000


@pytest.mark.second_bid
def test_second_bid_highest_bidder(
    create_app, opt_in, start_auction, send_first_bid, send_second_bid
):
    addr = bytes.fromhex(app_client.get_application_state()["highest_bidder"])
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
    pass


###################
# claim_asset tests
###################


@pytest.mark.claim_bid
def test_claim_asset(
    create_app,
    opt_in,
    start_auction,
    send_first_bid,
    send_second_bid,
    claim_bid,
    claim_asset,
):
    pass
