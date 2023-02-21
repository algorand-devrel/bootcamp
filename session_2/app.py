from beaker import *
from pyteal import *

class FirstApp(Application):
    @create
    def create(self):
        return Approve()

    @delete
    def delete(self):
        return Approve()

    @update
    def update(self):
        return Approve()

    @external
    def hello(self, name: abi.String, *, output: abi.String):
        return output.set(
            Concat(Bytes("Hello "), name.get())
        )
    
    @external
    def add(self, a: abi.Uint64, b: abi.Uint64, *, output: abi.Uint64):
        add_expr = a.get() + b.get()
        return output.set(add_expr + Int(5))

    @external
    def multi_logger(self, a: abi.String, b: abi.String, *, output: abi.String):
        return Seq(
            Log(a.get()),
            Log(b.get()),
            output.set(Concat(a.get(), b.get()))
        )

    @external
    def if_expression(self, input: abi.Uint64, *, output: abi.String):            
        #return If(
        #    input.get() > Int(5)
        #).Then(
        #    output.set(Bytes("Input is greater than five"))
        #).Else(
        #    output.set(Bytes("Input is NOT greater than five"))
        #)

        if input.get() > Int(5):
            return output.set(Bytes("Input is greater than five"))
        else:
            return output.set(Bytes("Input is NOT greater than five"))

    @external
    def cond_expression(self, input: abi.Uint64, *, output: abi.String):
        return Cond(
            [input.get() == Int(1), output.set(Bytes("The value was one!"))],
            [input.get() == Int(2), output.set(Bytes("The value was two!"))]
            # Fail if neither is true
        )


    

first_app = FirstApp(version=8)
first_app.dump()

acct = sandbox.get_accounts()[0]

app_client = client.application_client.ApplicationClient(
    app=first_app,
    client=sandbox.clients.get_algod_client(),
    sender=acct.address,
    signer=acct.signer,
)

app_client.create()
return_object = app_client.call(method=FirstApp.if_expression, input=4)
print(return_object.return_value)
