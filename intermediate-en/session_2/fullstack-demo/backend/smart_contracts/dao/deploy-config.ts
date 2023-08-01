import * as algokit from '@algorandfoundation/algokit-utils'
import { DaoClient } from '../artifacts/dao/client'

// Below is a showcase of various deployment options you can use in TypeScript Client
export async function deploy() {
  console.log('=== Deploying Dao ===')

  const algod = algokit.getAlgoClient()
  const indexer = algokit.getAlgoIndexerClient()
  const deployer = await algokit.getAccount(
    { config: algokit.getAccountConfigFromEnvironment('DEPLOYER'), fundWith: algokit.algos(3) },
    algod,
  )
  await algokit.ensureFunded(
    {
      accountToFund: deployer,
      minSpendingBalance: algokit.algos(2),
      minFundingIncrement: algokit.algos(2),
    },
    algod,
  )
  const isMainNet = await algokit.isMainNet(algod)
  const appClient = new DaoClient(
    {
      resolveBy: 'creatorAndName',
      findExistingUsing: indexer,
      sender: deployer,
      creatorAddress: deployer.addr,
    },
    algod,
  )
  const app = await appClient.deploy({
    onSchemaBreak: 'append',
    onUpdate: 'append',
  })
  

  // If app was just created fund the app account
  if (['create', 'replace'].includes(app.operationPerformed)) {
    algokit.transferAlgos(
      {
        amount: algokit.algos(1),
        from: deployer,
        to: app.appAddress,
      },
      algod,
    )
  }

  const method = 'hello'
  const response = await appClient.hello({ name: 'world' })
  console.log(`Called ${method} on ${app.name} (${app.appId}) with name = world, received: ${response.return}`)
}
