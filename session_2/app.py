from beaker import *
from pyteal import *


class FirstApp(Application):
    @create
    def create(self):
        return Approve()

    @external
    def hello(self, name: abi.String, *, output: abi.String):
        return output.set(Concat(Bytes("Hello, "), name.get()))

    @external
    def add(self, a: abi.Uint64, b: abi.Uint64, *, output: abi.Uint64):
        return output.set(a.get() + b.get() + Int(5))

    @external
    def logger(self, a: abi.String, b: abi.String, *, output: abi.String):
        log_value = "this is our return value".capitalize()
        output_expr = output.set(Bytes(log_value))

        return Seq(Log(a.get()), Log(b.get()), output_expr)

    @external
    def if_expression(self, input: abi.Uint64, *, output: abi.String):
        return If(
            input.get() > Int(5),
            output.set(Bytes("Output greater than 5!")),
            output.set(Bytes("Output is NOT greater than 5!")),
        )

    @external
    def cond_expression(self, input: abi.Uint64, *, output: abi.String):
        return Cond(
            [input.get() == Int(1), output.set(Bytes("The input value was one!"))],
            [input.get() == Int(2), output.set(Bytes("The input value was two!"))]
            # Otherwise fail
        )


first_app = FirstApp(version=8)
first_app.dump()

acct = sandbox.get_accounts()[0]

app_client = client.application_client.ApplicationClient(
    client=sandbox.clients.get_algod_client(),
    app=first_app,
    sender=acct.address,
    signer=acct.signer,
)

app_client.create()
return_obj = app_client.call(method=FirstApp.logger, a="A", b="B")

print(return_obj.return_value)
