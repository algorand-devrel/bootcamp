import * as algokit from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

async function main() {

    const camilo = algosdk.generateAccount();
    console.log(camilo.addr)

    const algod = algokit.getAlgoClient(algokit.getDefaultLocalNetConfig('algod'));

    //obtener información de la cuenta

    //console.log( await algod.accountInformation(camilo.addr).do());

    //agregar ALGOS a la cuenta de Camilo

    const kmd = algokit.getAlgoKmdClient(algokit.getDefaultLocalNetConfig('kmd'));

    await algokit.ensureFunded({
        accountToFund: camilo.addr,
        minSpendingBalance: algokit.algos(10)
    },
    algod,
    kmd
    )

    //obtener informacion de la cuenta
    //console.log( await algod.accountInformation(camilo.addr).do());

    //crear un segunga cuenta, Evert

    const evert = algosdk.generateAccount();
    console.log(evert.addr)

    // transferir ALGOS
    const algoTransfer = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: camilo.addr,
        to: evert.addr,
        amount: 0.5 * 1e6, // convierto de algos a microalgos
        suggestedParams: await algod.getTransactionParams().do()
    })

    //obtener informacion de la cuenta
    console.log( await algod.accountInformation(evert.addr).do());

    // enviar la transacción a la red

    const resultTransferTx = await algokit.sendTransaction(
        {
            transaction: algoTransfer,
            from: camilo
        },
        algod
    );

    //obtener informacion de la cuenta
    console.log( await algod.accountInformation(evert.addr).do());

    // ASA === Crear un algorand standard asset

    const asaCreation = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: camilo.addr,
        assetName: 'AlgoFam coin',
        unitName: 'ALF',
        total: 1000000,
        decimals:1,
        defaultFrozen:false,
        suggestedParams: await algod.getTransactionParams().do()

    });

    console.log(asaCreation);

    //enviar la transacción de crear asset

    const createAssetTxn = await algokit.sendTransaction(
        {
            transaction: asaCreation,
            from:camilo
        },
        algod
    );

    console.log(createAssetTxn)

    const assetIndex = Number(createAssetTxn.confirmation!.assetIndex)
    console.log(assetIndex)

    // crear transaccion de transferencia del asset a EVERT

    const asaTranfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: camilo.addr,
        to: evert.addr,
        assetIndex,
        amount: 10000,
        suggestedParams: await algod.getTransactionParams().do()
    }
    );

    try{
        await algokit.sendTransaction(
        {
            transaction:asaTranfer,
            from:camilo
        },
        algod
    )}
    catch(error){
        console.warn(error)
    }

    //transaccion de optin

    const optIn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: evert.addr,
        to: evert.addr,
        assetIndex,
        amount:0,
        suggestedParams: await algod.getTransactionParams().do()
    })

    await algokit.ensureFunded({
        accountToFund: evert.addr,
        minSpendingBalance: algokit.algos(10)
    },
    algod,
    kmd
    );

    // crear la transferencia atomica de optin y assetTransfer a Evert

    const groupTxResult = await algokit.sendGroupOfTransactions(
        {
            transactions:[
                {
                    transaction: optIn,
                    signer:evert
                },
                {
                    transaction:asaTranfer,
                    signer:camilo
                }
            ]
        }, 
        algod
    );

    console.log(groupTxResult)

    //obtener información de la cuenta camilo
    console.log(await algod.accountInformation(camilo.addr).do())

    //obtener información de la cuenta evert
    console.log(await algod.accountInformation(evert.addr).do())

}

main();