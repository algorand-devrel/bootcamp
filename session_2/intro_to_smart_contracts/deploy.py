from beaker import client, sandbox

from app import app

app.build().export("./artifacts")

accounts = sandbox.kmd.get_accounts()
sender = accounts[0]

app_client = client.ApplicationClient(
    client=sandbox.get_algod_client(),
    app=app,
    sender=sender.address,
    signer=sender.signer,
)

app_client.create()

app_client.call("increment")
app_client.call("increment")
return_value = app_client.call("increment").return_value
print(return_value)
