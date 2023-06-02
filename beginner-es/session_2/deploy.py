from beaker import client, localnet

from calculator import app, hello

app.build().export("./artifacts")

accounts = localnet.kmd.get_accounts()
sender = accounts[0]


app_client = client.ApplicationClient(
    client=localnet.get_algod_client(),
    app=app,
    sender=sender.address,
    signer=sender.signer,
)

app_client.create()
app_client.opt_in()

return_value = app_client.call(hello, name="AlgoLATAM").return_value

print(return_value)
