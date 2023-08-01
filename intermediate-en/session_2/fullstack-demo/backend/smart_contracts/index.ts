import { consoleLogger } from '@algorandfoundation/algokit-utils/types/logging'
import * as algokit from '@algorandfoundation/algokit-utils'
import { deploy as DaoDeployer } from './dao/deploy-config'

const contractDeployers = [DaoDeployer]

algokit.Config.configure({
  logger: consoleLogger,
})
;(async () => {
  for (const deployer of contractDeployers) {
    try {
      await deployer()
    } catch (e) {
      console.error(e)
    }
  }
})()
