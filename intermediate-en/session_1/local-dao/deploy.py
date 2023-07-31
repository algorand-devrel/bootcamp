from pathlib import Path

from beaker import client, sandbox

from app import app, hello
from utils import build

root_path = Path(__file__).parent
build(root_path / "artifacts", app)

accounts = sandbox.kmd.get_accounts()
sender = accounts[0]

app_client = client.ApplicationClient(
    client=sandbox.get_algod_client(),
    app=app,
    sender=sender.address,
    signer=sender.signer,
)

app_client.create()

return_value = app_client.call(hello, name="Beaker").return_value
print(return_value)
