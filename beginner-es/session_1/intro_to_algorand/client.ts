import * as algosdk from 'algosdk'
import * as dotenv from 'dotenv'

dotenv.config()

const token = process.env.LOCALNET_TOKEN as string
const server = process.env.LOCALNET_SERVER as string
const port = process.env.LOCALNET_PORT

export const algodClient = new algosdk.Algodv2(token, server, port)
