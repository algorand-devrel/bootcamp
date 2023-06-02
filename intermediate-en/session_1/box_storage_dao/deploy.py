from beaker import client, sandbox

from app import app
from algosdk import encoding

app.build().export("./artifacts")

accounts = sandbox.kmd.get_accounts()
sender = accounts[0]
alice = accounts[1]
bob = accounts[2]

app_client = client.ApplicationClient(
    client=sandbox.get_algod_client(),
    app=app,
    sender=sender.address,
    signer=sender.signer,
)

app_client.create()

app_client.fund(121_300)

app_client.call(
    "add_proposal", 
    desc="Hello World", 
    sender=alice.address, 
    signer=alice.signer, 
    boxes=[(0, b"p-" + encoding.decode_address(alice.address))]
)

app_client.fund(157100 - 121_300)

app_client.call(
    "support", 
    proposer=alice.address, 
    sender=bob.address, 
    signer=bob.signer, 
    boxes=[(0, b"h-" + encoding.decode_address(bob.address)), (0, b"v-" + encoding.decode_address(alice.address))]
)

for box in app_client.get_box_names():
    print(f"{box} -> {app_client.get_box_contents(box)}")
