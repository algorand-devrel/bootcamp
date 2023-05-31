from beaker import client, sandbox

from app import app

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

app_client.call("add_proposal", desc="Hello World", sender=alice.address, signer=alice.signer)
app_client.call("support", proposal_id=0, sender=bob.address, signer=bob.signer)
print(app_client.get_global_state())
