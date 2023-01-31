#!/usr/bin/env python3
from pyteal import *
from beaker import *
import os
import json
from typing import Final

APP_CREATOR = Seq(creator := AppParam.creator(Int(0)), creator.value())

class Auction(Application):
    # Global State
    # - Highest Bidder: The address of the highest bidder
    # - Highest Bid: The amount of the highest bid
    # - Auction End: The timestamp when the auction ends
    # - ASA: The ASA being auctioned
    # - ASA Amount: The amount of ASA being auctioned

    # Create Application

    # Opt app into ASA

    # Start auction
    # Need to define starting price and length of auction
    # We also need to ensure the ASA is sent to the app

    # Bid
    # Place a new bid and return previous bid

    # Claim bid
    # Let's the auctioner claim the highest bid once the auction has ended

    # Claim asset
    # Let's the highest bidder claim the asset once the auction has ended

    # Delete app
    # Send MBR funds to creator and delete app



if __name__ == "__main__":
    app = Auction(version=7)

    if os.path.exists("approval.teal"):
        os.remove("approval.teal")

    if os.path.exists("approval.teal"):
        os.remove("clear.teal")

    if os.path.exists("abi.json"):
        os.remove("abi.json")

    if os.path.exists("app_spec.json"):
        os.remove("app_spec.json")

    with open("approval.teal", "w") as f:
        f.write(app.approval_program)

    with open("clear.teal", "w") as f:
        f.write(app.clear_program)

    with open("abi.json", "w") as f:
        f.write(json.dumps(app.contract.dictify(), indent=4))

    with open("app_spec.json", "w") as f:
        f.write(json.dumps(app.application_spec(), indent=4))