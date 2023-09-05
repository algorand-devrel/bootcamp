import { consoleLogger } from '@algorandfoundation/algokit-utils/types/logging'
import * as algokit from '@algorandfoundation/algokit-utils'
import { deploy as AuctionDeployer } from './auction/deploy-config'

const contractDeployers = [AuctionDeployer]

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
