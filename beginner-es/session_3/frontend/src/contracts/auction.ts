/* eslint-disable */
/**
 * This file was automatically generated by @algorandfoundation/algokit-client-generator.
 * DO NOT MODIFY IT BY HAND.
 * requires: @algorandfoundation/algokit-utils: ^2
 */
import * as algokit from '@algorandfoundation/algokit-utils'
import {
  AppCallTransactionResult,
  AppCallTransactionResultOfType,
  CoreAppCallArgs,
  RawAppCallArgs,
  AppState,
  TealTemplateParams,
  ABIAppCallArg,
} from '@algorandfoundation/algokit-utils/types/app'
import {
  AppClientCallCoreParams,
  AppClientCompilationParams,
  AppClientDeployCoreParams,
  AppDetails,
  ApplicationClient,
} from '@algorandfoundation/algokit-utils/types/app-client'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { SendTransactionResult, TransactionToSign, SendTransactionFrom } from '@algorandfoundation/algokit-utils/types/transaction'
import { Algodv2, OnApplicationComplete, Transaction, TransactionWithSigner, AtomicTransactionComposer } from 'algosdk'
export const APP_SPEC: AppSpec = {
  "hints": {
    "optin_to_asset(pay,asset)void": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "start(uint64,uint64,axfer)void": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "bid(pay,account)void": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "claim_asset(asset)void": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "claim_bid()void": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "get_time()uint64": {
      "call_config": {
        "no_op": "CALL"
      }
    }
  },
  "source": {
    "approval": "I3ByYWdtYSB2ZXJzaW9uIDgKaW50Y2Jsb2NrIDAgMSA0CmJ5dGVjYmxvY2sgMHg2ODY5Njc2ODY1NzM3NDVmNjI2OTY0IDB4Nzc2OTZlNmU2NTcyIDB4NjE3MzYxNWY2OTY0IDB4NjE3NTYzNzQ2OTZmNmU1ZjY1NmU2NCAweAp0eG4gTnVtQXBwQXJncwppbnRjXzAgLy8gMAo9PQpibnogbWFpbl9sMTQKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMApwdXNoYnl0ZXMgMHg3ZGNlY2VlZSAvLyAib3B0aW5fdG9fYXNzZXQocGF5LGFzc2V0KXZvaWQiCj09CmJueiBtYWluX2wxMwp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweDA5YTVhNzkwIC8vICJzdGFydCh1aW50NjQsdWludDY0LGF4ZmVyKXZvaWQiCj09CmJueiBtYWluX2wxMgp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweDM5MDQyYWVlIC8vICJiaWQocGF5LGFjY291bnQpdm9pZCIKPT0KYm56IG1haW5fbDExCnR4bmEgQXBwbGljYXRpb25BcmdzIDAKcHVzaGJ5dGVzIDB4MWVjMTJiZWYgLy8gImNsYWltX2Fzc2V0KGFzc2V0KXZvaWQiCj09CmJueiBtYWluX2wxMAp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweGI1ODkwNjg2IC8vICJjbGFpbV9iaWQoKXZvaWQiCj09CmJueiBtYWluX2w5CnR4bmEgQXBwbGljYXRpb25BcmdzIDAKcHVzaGJ5dGVzIDB4ZTY1NTIyZmQgLy8gImdldF90aW1lKCl1aW50NjQiCj09CmJueiBtYWluX2w4CmVycgptYWluX2w4Ogp0eG4gT25Db21wbGV0aW9uCmludGNfMCAvLyBOb09wCj09CnR4biBBcHBsaWNhdGlvbklECmludGNfMCAvLyAwCiE9CiYmCmFzc2VydApjYWxsc3ViIGdldHRpbWVjYXN0ZXJfMTIKaW50Y18xIC8vIDEKcmV0dXJuCm1haW5fbDk6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CmNhbGxzdWIgY2xhaW1iaWRjYXN0ZXJfMTEKaW50Y18xIC8vIDEKcmV0dXJuCm1haW5fbDEwOgp0eG4gT25Db21wbGV0aW9uCmludGNfMCAvLyBOb09wCj09CnR4biBBcHBsaWNhdGlvbklECmludGNfMCAvLyAwCiE9CiYmCmFzc2VydApjYWxsc3ViIGNsYWltYXNzZXRjYXN0ZXJfMTAKaW50Y18xIC8vIDEKcmV0dXJuCm1haW5fbDExOgp0eG4gT25Db21wbGV0aW9uCmludGNfMCAvLyBOb09wCj09CnR4biBBcHBsaWNhdGlvbklECmludGNfMCAvLyAwCiE9CiYmCmFzc2VydApjYWxsc3ViIGJpZGNhc3Rlcl85CmludGNfMSAvLyAxCnJldHVybgptYWluX2wxMjoKdHhuIE9uQ29tcGxldGlvbgppbnRjXzAgLy8gTm9PcAo9PQp0eG4gQXBwbGljYXRpb25JRAppbnRjXzAgLy8gMAohPQomJgphc3NlcnQKY2FsbHN1YiBzdGFydGNhc3Rlcl84CmludGNfMSAvLyAxCnJldHVybgptYWluX2wxMzoKdHhuIE9uQ29tcGxldGlvbgppbnRjXzAgLy8gTm9PcAo9PQp0eG4gQXBwbGljYXRpb25JRAppbnRjXzAgLy8gMAohPQomJgphc3NlcnQKY2FsbHN1YiBvcHRpbnRvYXNzZXRjYXN0ZXJfNwppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMTQ6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KYm56IG1haW5fbDE2CmVycgptYWluX2wxNjoKdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKPT0KYXNzZXJ0CmNhbGxzdWIgY3JlYXRlXzAKaW50Y18xIC8vIDEKcmV0dXJuCgovLyBjcmVhdGUKY3JlYXRlXzA6CnByb3RvIDAgMApieXRlY18yIC8vICJhc2FfaWQiCmludGNfMCAvLyAwCmFwcF9nbG9iYWxfcHV0CmJ5dGVjXzMgLy8gImF1Y3Rpb25fZW5kIgppbnRjXzAgLy8gMAphcHBfZ2xvYmFsX3B1dApieXRlY18wIC8vICJoaWdoZXN0X2JpZCIKaW50Y18wIC8vIDAKYXBwX2dsb2JhbF9wdXQKYnl0ZWNfMSAvLyAid2lubmVyIgpieXRlYyA0IC8vICIiCmFwcF9nbG9iYWxfcHV0CnJldHN1YgoKLy8gb3B0aW5fdG9fYXNzZXQKb3B0aW50b2Fzc2V0XzE6CnByb3RvIDIgMApmcmFtZV9kaWcgLTIKZ3R4bnMgUmVjZWl2ZXIKZ2xvYmFsIEN1cnJlbnRBcHBsaWNhdGlvbkFkZHJlc3MKPT0KYXNzZXJ0CmJ5dGVjXzIgLy8gImFzYV9pZCIKZnJhbWVfZGlnIC0xCnR4bmFzIEFzc2V0cwphcHBfZ2xvYmFsX3B1dAppdHhuX2JlZ2luCmludGNfMiAvLyBheGZlcgppdHhuX2ZpZWxkIFR5cGVFbnVtCmdsb2JhbCBDdXJyZW50QXBwbGljYXRpb25BZGRyZXNzCml0eG5fZmllbGQgQXNzZXRSZWNlaXZlcgppbnRjXzAgLy8gMAppdHhuX2ZpZWxkIEFzc2V0QW1vdW50CmZyYW1lX2RpZyAtMQp0eG5hcyBBc3NldHMKaXR4bl9maWVsZCBYZmVyQXNzZXQKaW50Y18wIC8vIDAKaXR4bl9maWVsZCBGZWUKaXR4bl9zdWJtaXQKcmV0c3ViCgovLyBzdGFydApzdGFydF8yOgpwcm90byAzIDAKYnl0ZWNfMCAvLyAiaGlnaGVzdF9iaWQiCmZyYW1lX2RpZyAtMgphcHBfZ2xvYmFsX3B1dApieXRlY18zIC8vICJhdWN0aW9uX2VuZCIKZ2xvYmFsIExhdGVzdFRpbWVzdGFtcApmcmFtZV9kaWcgLTMKKwphcHBfZ2xvYmFsX3B1dApyZXRzdWIKCi8vIGJpZApiaWRfMzoKcHJvdG8gMiAwCmZyYW1lX2RpZyAtMgpndHhucyBBbW91bnQKYnl0ZWNfMCAvLyAiaGlnaGVzdF9iaWQiCmFwcF9nbG9iYWxfZ2V0Cj4KYXNzZXJ0CmJ5dGVjXzEgLy8gIndpbm5lciIKYXBwX2dsb2JhbF9nZXQKYnl0ZWMgNCAvLyAiIgohPQpieiBiaWRfM19sMgppdHhuX2JlZ2luCmludGNfMSAvLyBwYXkKaXR4bl9maWVsZCBUeXBlRW51bQpieXRlY18xIC8vICJ3aW5uZXIiCmFwcF9nbG9iYWxfZ2V0Cml0eG5fZmllbGQgUmVjZWl2ZXIKYnl0ZWNfMCAvLyAiaGlnaGVzdF9iaWQiCmFwcF9nbG9iYWxfZ2V0Cml0eG5fZmllbGQgQW1vdW50CmludGNfMCAvLyAwCml0eG5fZmllbGQgRmVlCml0eG5fc3VibWl0CmJpZF8zX2wyOgpieXRlY18xIC8vICJ3aW5uZXIiCmZyYW1lX2RpZyAtMgpndHhucyBTZW5kZXIKYXBwX2dsb2JhbF9wdXQKYnl0ZWNfMCAvLyAiaGlnaGVzdF9iaWQiCmZyYW1lX2RpZyAtMgpndHhucyBBbW91bnQKYXBwX2dsb2JhbF9wdXQKcmV0c3ViCgovLyBjbGFpbV9hc3NldApjbGFpbWFzc2V0XzQ6CnByb3RvIDEgMAppdHhuX2JlZ2luCmludGNfMiAvLyBheGZlcgppdHhuX2ZpZWxkIFR5cGVFbnVtCmJ5dGVjXzEgLy8gIndpbm5lciIKYXBwX2dsb2JhbF9nZXQKaXR4bl9maWVsZCBBc3NldFJlY2VpdmVyCmludGNfMSAvLyAxCml0eG5fZmllbGQgQXNzZXRBbW91bnQKYnl0ZWNfMiAvLyAiYXNhX2lkIgphcHBfZ2xvYmFsX2dldAppdHhuX2ZpZWxkIFhmZXJBc3NldAppbnRjXzAgLy8gMAppdHhuX2ZpZWxkIEZlZQppdHhuX3N1Ym1pdApyZXRzdWIKCi8vIGNsYWltX2JpZApjbGFpbWJpZF81Ogpwcm90byAwIDAKaXR4bl9iZWdpbgppbnRjXzEgLy8gcGF5Cml0eG5fZmllbGQgVHlwZUVudW0KZ2xvYmFsIENyZWF0b3JBZGRyZXNzCml0eG5fZmllbGQgUmVjZWl2ZXIKYnl0ZWNfMCAvLyAiaGlnaGVzdF9iaWQiCmFwcF9nbG9iYWxfZ2V0Cml0eG5fZmllbGQgQW1vdW50CmludGNfMCAvLyAwCml0eG5fZmllbGQgRmVlCml0eG5fc3VibWl0CnJldHN1YgoKLy8gZ2V0X3RpbWUKZ2V0dGltZV82Ogpwcm90byAwIDEKaW50Y18wIC8vIDAKZ2xvYmFsIExhdGVzdFRpbWVzdGFtcApmcmFtZV9idXJ5IDAKcmV0c3ViCgovLyBvcHRpbl90b19hc3NldF9jYXN0ZXIKb3B0aW50b2Fzc2V0Y2FzdGVyXzc6CnByb3RvIDAgMAppbnRjXzAgLy8gMApkdXAKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMQppbnRjXzAgLy8gMApnZXRieXRlCmZyYW1lX2J1cnkgMQp0eG4gR3JvdXBJbmRleAppbnRjXzEgLy8gMQotCmZyYW1lX2J1cnkgMApmcmFtZV9kaWcgMApndHhucyBUeXBlRW51bQppbnRjXzEgLy8gcGF5Cj09CmFzc2VydApmcmFtZV9kaWcgMApmcmFtZV9kaWcgMQpjYWxsc3ViIG9wdGludG9hc3NldF8xCnJldHN1YgoKLy8gc3RhcnRfY2FzdGVyCnN0YXJ0Y2FzdGVyXzg6CnByb3RvIDAgMAppbnRjXzAgLy8gMApkdXBuIDIKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMQpidG9pCmZyYW1lX2J1cnkgMAp0eG5hIEFwcGxpY2F0aW9uQXJncyAyCmJ0b2kKZnJhbWVfYnVyeSAxCnR4biBHcm91cEluZGV4CmludGNfMSAvLyAxCi0KZnJhbWVfYnVyeSAyCmZyYW1lX2RpZyAyCmd0eG5zIFR5cGVFbnVtCmludGNfMiAvLyBheGZlcgo9PQphc3NlcnQKZnJhbWVfZGlnIDAKZnJhbWVfZGlnIDEKZnJhbWVfZGlnIDIKY2FsbHN1YiBzdGFydF8yCnJldHN1YgoKLy8gYmlkX2Nhc3RlcgpiaWRjYXN0ZXJfOToKcHJvdG8gMCAwCmludGNfMCAvLyAwCmR1cAp0eG5hIEFwcGxpY2F0aW9uQXJncyAxCmludGNfMCAvLyAwCmdldGJ5dGUKZnJhbWVfYnVyeSAxCnR4biBHcm91cEluZGV4CmludGNfMSAvLyAxCi0KZnJhbWVfYnVyeSAwCmZyYW1lX2RpZyAwCmd0eG5zIFR5cGVFbnVtCmludGNfMSAvLyBwYXkKPT0KYXNzZXJ0CmZyYW1lX2RpZyAwCmZyYW1lX2RpZyAxCmNhbGxzdWIgYmlkXzMKcmV0c3ViCgovLyBjbGFpbV9hc3NldF9jYXN0ZXIKY2xhaW1hc3NldGNhc3Rlcl8xMDoKcHJvdG8gMCAwCmludGNfMCAvLyAwCnR4bmEgQXBwbGljYXRpb25BcmdzIDEKaW50Y18wIC8vIDAKZ2V0Ynl0ZQpmcmFtZV9idXJ5IDAKZnJhbWVfZGlnIDAKY2FsbHN1YiBjbGFpbWFzc2V0XzQKcmV0c3ViCgovLyBjbGFpbV9iaWRfY2FzdGVyCmNsYWltYmlkY2FzdGVyXzExOgpwcm90byAwIDAKY2FsbHN1YiBjbGFpbWJpZF81CnJldHN1YgoKLy8gZ2V0X3RpbWVfY2FzdGVyCmdldHRpbWVjYXN0ZXJfMTI6CnByb3RvIDAgMAppbnRjXzAgLy8gMApjYWxsc3ViIGdldHRpbWVfNgpmcmFtZV9idXJ5IDAKcHVzaGJ5dGVzIDB4MTUxZjdjNzUgLy8gMHgxNTFmN2M3NQpmcmFtZV9kaWcgMAppdG9iCmNvbmNhdApsb2cKcmV0c3Vi",
    "clear": "I3ByYWdtYSB2ZXJzaW9uIDgKcHVzaGludCAwIC8vIDAKcmV0dXJu"
  },
  "state": {
    "global": {
      "num_byte_slices": 1,
      "num_uints": 3
    },
    "local": {
      "num_byte_slices": 0,
      "num_uints": 0
    }
  },
  "schema": {
    "global": {
      "declared": {
        "asa_id": {
          "type": "uint64",
          "key": "asa_id",
          "descr": "Este es el ID del asset a subastarse, si es cero, la subasta aun no inicia."
        },
        "auction_end": {
          "type": "uint64",
          "key": "auction_end",
          "descr": "Duracion de la subasta, si es cero, la subasta aun no ha iniciado"
        },
        "highest_bid": {
          "type": "uint64",
          "key": "highest_bid",
          "descr": "Apuesta mayor hasta el momento"
        },
        "winner": {
          "type": "bytes",
          "key": "winner",
          "descr": "Cuenta del apostador mayor, ganador hasta ese momento, si es vacio, no hay ganador aún"
        }
      },
      "reserved": {}
    },
    "local": {
      "declared": {},
      "reserved": {}
    }
  },
  "contract": {
    "name": "auction",
    "methods": [
      {
        "name": "optin_to_asset",
        "args": [
          {
            "type": "pay",
            "name": "payment_to_contract"
          },
          {
            "type": "asset",
            "name": "asset"
          }
        ],
        "returns": {
          "type": "void"
        }
      },
      {
        "name": "start",
        "args": [
          {
            "type": "uint64",
            "name": "length"
          },
          {
            "type": "uint64",
            "name": "min"
          },
          {
            "type": "axfer",
            "name": "axfer"
          }
        ],
        "returns": {
          "type": "void"
        }
      },
      {
        "name": "bid",
        "args": [
          {
            "type": "pay",
            "name": "payment"
          },
          {
            "type": "account",
            "name": "prewinner"
          }
        ],
        "returns": {
          "type": "void"
        }
      },
      {
        "name": "claim_asset",
        "args": [
          {
            "type": "asset",
            "name": "asset"
          }
        ],
        "returns": {
          "type": "void"
        }
      },
      {
        "name": "claim_bid",
        "args": [],
        "returns": {
          "type": "void"
        }
      },
      {
        "name": "get_time",
        "args": [],
        "returns": {
          "type": "uint64"
        }
      }
    ],
    "networks": {}
  },
  "bare_call_config": {
    "no_op": "CREATE"
  }
}

/**
 * Defines an onCompletionAction of 'no_op'
 */
export type OnCompleteNoOp =  { onCompleteAction?: 'no_op' | OnApplicationComplete.NoOpOC }
/**
 * Defines an onCompletionAction of 'opt_in'
 */
export type OnCompleteOptIn =  { onCompleteAction: 'opt_in' | OnApplicationComplete.OptInOC }
/**
 * Defines an onCompletionAction of 'close_out'
 */
export type OnCompleteCloseOut =  { onCompleteAction: 'close_out' | OnApplicationComplete.CloseOutOC }
/**
 * Defines an onCompletionAction of 'delete_application'
 */
export type OnCompleteDelApp =  { onCompleteAction: 'delete_application' | OnApplicationComplete.DeleteApplicationOC }
/**
 * Defines an onCompletionAction of 'update_application'
 */
export type OnCompleteUpdApp =  { onCompleteAction: 'update_application' | OnApplicationComplete.UpdateApplicationOC }
/**
 * A state record containing a single unsigned integer
 */
export type IntegerState = {
  /**
   * Gets the state value as a BigInt 
   */
  asBigInt(): bigint
  /**
   * Gets the state value as a number.
   */
  asNumber(): number
}
/**
 * A state record containing binary data
 */
export type BinaryState = {
  /**
   * Gets the state value as a Uint8Array
   */
  asByteArray(): Uint8Array
  /**
   * Gets the state value as a string
   */
  asString(): string
}

/**
 * Defines the types of available calls and state of the Auction smart contract.
 */
export type Auction = {
  /**
   * Maps method signatures / names to their argument and return types.
   */
  methods:
    & Record<'optin_to_asset(pay,asset)void' | 'optin_to_asset', {
      argsObj: {
        payment_to_contract: TransactionToSign | Transaction | Promise<SendTransactionResult>
        asset: number | bigint
      }
      argsTuple: [payment_to_contract: TransactionToSign | Transaction | Promise<SendTransactionResult>, asset: number | bigint]
      returns: void
    }>
    & Record<'start(uint64,uint64,axfer)void' | 'start', {
      argsObj: {
        length: bigint | number
        min: bigint | number
        axfer: TransactionToSign | Transaction | Promise<SendTransactionResult>
      }
      argsTuple: [length: bigint | number, min: bigint | number, axfer: TransactionToSign | Transaction | Promise<SendTransactionResult>]
      returns: void
    }>
    & Record<'bid(pay,account)void' | 'bid', {
      argsObj: {
        payment: TransactionToSign | Transaction | Promise<SendTransactionResult>
        prewinner: string | Uint8Array
      }
      argsTuple: [payment: TransactionToSign | Transaction | Promise<SendTransactionResult>, prewinner: string | Uint8Array]
      returns: void
    }>
    & Record<'claim_asset(asset)void' | 'claim_asset', {
      argsObj: {
        asset: number | bigint
      }
      argsTuple: [asset: number | bigint]
      returns: void
    }>
    & Record<'claim_bid()void' | 'claim_bid', {
      argsObj: {
      }
      argsTuple: []
      returns: void
    }>
    & Record<'get_time()uint64' | 'get_time', {
      argsObj: {
      }
      argsTuple: []
      returns: bigint
    }>
  /**
   * Defines the shape of the global and local state of the application.
   */
  state: {
    global: {
      /**
       * Este es el ID del asset a subastarse, si es cero, la subasta aun no inicia.
       */
      'asa_id'?: IntegerState
      /**
       * Duracion de la subasta, si es cero, la subasta aun no ha iniciado
       */
      'auction_end'?: IntegerState
      /**
       * Apuesta mayor hasta el momento
       */
      'highest_bid'?: IntegerState
      /**
       * Cuenta del apostador mayor, ganador hasta ese momento, si es vacio, no hay ganador aún
       */
      'winner'?: BinaryState
    }
  }
}
/**
 * Defines the possible abi call signatures
 */
export type AuctionSig = keyof Auction['methods']
/**
 * Defines an object containing all relevant parameters for a single call to the contract. Where TSignature is undefined, a bare call is made
 */
export type TypedCallParams<TSignature extends AuctionSig | undefined> = {
  method: TSignature
  methodArgs: TSignature extends undefined ? undefined : Array<ABIAppCallArg | undefined>
} & AppClientCallCoreParams & CoreAppCallArgs
/**
 * Defines the arguments required for a bare call
 */
export type BareCallArgs = Omit<RawAppCallArgs, keyof CoreAppCallArgs>
/**
 * Maps a method signature from the Auction smart contract to the method's arguments in either tuple of struct form
 */
export type MethodArgs<TSignature extends AuctionSig> = Auction['methods'][TSignature]['argsObj' | 'argsTuple']
/**
 * Maps a method signature from the Auction smart contract to the method's return type
 */
export type MethodReturn<TSignature extends AuctionSig> = Auction['methods'][TSignature]['returns']

/**
 * A factory for available 'create' calls
 */
export type AuctionCreateCalls = (typeof AuctionCallFactory)['create']
/**
 * Defines supported create methods for this smart contract
 */
export type AuctionCreateCallParams =
  | (TypedCallParams<undefined> & (OnCompleteNoOp))
/**
 * Defines arguments required for the deploy method.
 */
export type AuctionDeployArgs = {
  deployTimeParams?: TealTemplateParams
  /**
   * A delegate which takes a create call factory and returns the create call params for this smart contract
   */
  createCall?: (callFactory: AuctionCreateCalls) => AuctionCreateCallParams
}


/**
 * Exposes methods for constructing all available smart contract calls
 */
export abstract class AuctionCallFactory {
  /**
   * Gets available create call factories
   */
  static get create() {
    return {
      /**
       * Constructs a create call for the auction smart contract using a bare call
       *
       * @param params Any parameters for the call
       * @returns A TypedCallParams object for the call
       */
      bare(params: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs & AppClientCompilationParams & (OnCompleteNoOp) = {}) {
        return {
          method: undefined,
          methodArgs: undefined,
          ...params,
        }
      },
    }
  }

  /**
   * Constructs a no op call for the optin_to_asset(pay,asset)void ABI method
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static optinToAsset(args: MethodArgs<'optin_to_asset(pay,asset)void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'optin_to_asset(pay,asset)void' as const,
      methodArgs: Array.isArray(args) ? args : [args.payment_to_contract, args.asset],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the start(uint64,uint64,axfer)void ABI method
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static start(args: MethodArgs<'start(uint64,uint64,axfer)void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'start(uint64,uint64,axfer)void' as const,
      methodArgs: Array.isArray(args) ? args : [args.length, args.min, args.axfer],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the bid(pay,account)void ABI method
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static bid(args: MethodArgs<'bid(pay,account)void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'bid(pay,account)void' as const,
      methodArgs: Array.isArray(args) ? args : [args.payment, args.prewinner],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the claim_asset(asset)void ABI method
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static claimAsset(args: MethodArgs<'claim_asset(asset)void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'claim_asset(asset)void' as const,
      methodArgs: Array.isArray(args) ? args : [args.asset],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the claim_bid()void ABI method
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static claimBid(args: MethodArgs<'claim_bid()void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'claim_bid()void' as const,
      methodArgs: Array.isArray(args) ? args : [],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the get_time()uint64 ABI method
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static getTime(args: MethodArgs<'get_time()uint64'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'get_time()uint64' as const,
      methodArgs: Array.isArray(args) ? args : [],
      ...params,
    }
  }
}

/**
 * A client to make calls to the auction smart contract
 */
export class AuctionClient {
  /**
   * The underlying `ApplicationClient` for when you want to have more flexibility
   */
  public readonly appClient: ApplicationClient

  private readonly sender: SendTransactionFrom | undefined

  /**
   * Creates a new instance of `AuctionClient`
   *
   * @param appDetails appDetails The details to identify the app to deploy
   * @param algod An algod client instance
   */
  constructor(appDetails: AppDetails, private algod: Algodv2) {
    this.sender = appDetails.sender
    this.appClient = algokit.getAppClient({
      ...appDetails,
      app: APP_SPEC
    }, algod)
  }

  /**
   * Checks for decode errors on the AppCallTransactionResult and maps the return value to the specified generic type
   *
   * @param result The AppCallTransactionResult to be mapped
   * @param returnValueFormatter An optional delegate to format the return value if required
   * @returns The smart contract response with an updated return value
   */
  protected mapReturnValue<TReturn>(result: AppCallTransactionResult, returnValueFormatter?: (value: any) => TReturn): AppCallTransactionResultOfType<TReturn> {
    if(result.return?.decodeError) {
      throw result.return.decodeError
    }
    const returnValue = result.return?.returnValue !== undefined && returnValueFormatter !== undefined
      ? returnValueFormatter(result.return.returnValue)
      : result.return?.returnValue as TReturn | undefined
      return { ...result, return: returnValue }
  }

  /**
   * Calls the ABI method with the matching signature using an onCompletion code of NO_OP
   *
   * @param typedCallParams An object containing the method signature, args, and any other relevant parameters
   * @param returnValueFormatter An optional delegate which when provided will be used to map non-undefined return values to the target type
   * @returns The result of the smart contract call
   */
  public async call<TSignature extends keyof Auction['methods']>(typedCallParams: TypedCallParams<TSignature>, returnValueFormatter?: (value: any) => MethodReturn<TSignature>) {
    return this.mapReturnValue<MethodReturn<TSignature>>(await this.appClient.call(typedCallParams), returnValueFormatter)
  }

  /**
   * Idempotently deploys the auction smart contract.
   *
   * @param params The arguments for the contract calls and any additional parameters for the call
   * @returns The deployment result
   */
  public deploy(params: AuctionDeployArgs & AppClientDeployCoreParams = {}): ReturnType<ApplicationClient['deploy']> {
    const createArgs = params.createCall?.(AuctionCallFactory.create)
    return this.appClient.deploy({
      ...params,
      createArgs,
      createOnCompleteAction: createArgs?.onCompleteAction,
    })
  }

  /**
   * Gets available create methods
   */
  public get create() {
    const $this = this
    return {
      /**
       * Creates a new instance of the auction smart contract using a bare call.
       *
       * @param args The arguments for the bare call
       * @returns The create result
       */
      bare(args: BareCallArgs & AppClientCallCoreParams & AppClientCompilationParams & CoreAppCallArgs & (OnCompleteNoOp) = {}): Promise<AppCallTransactionResultOfType<undefined>> {
        return $this.appClient.create(args) as unknown as Promise<AppCallTransactionResultOfType<undefined>>
      },
    }
  }

  /**
   * Makes a clear_state call to an existing instance of the auction smart contract.
   *
   * @param args The arguments for the bare call
   * @returns The clear_state result
   */
  public clearState(args: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.appClient.clearState(args)
  }

  /**
   * Calls the optin_to_asset(pay,asset)void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public optinToAsset(args: MethodArgs<'optin_to_asset(pay,asset)void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(AuctionCallFactory.optinToAsset(args, params))
  }

  /**
   * Calls the start(uint64,uint64,axfer)void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public start(args: MethodArgs<'start(uint64,uint64,axfer)void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(AuctionCallFactory.start(args, params))
  }

  /**
   * Calls the bid(pay,account)void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public bid(args: MethodArgs<'bid(pay,account)void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(AuctionCallFactory.bid(args, params))
  }

  /**
   * Calls the claim_asset(asset)void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public claimAsset(args: MethodArgs<'claim_asset(asset)void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(AuctionCallFactory.claimAsset(args, params))
  }

  /**
   * Calls the claim_bid()void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public claimBid(args: MethodArgs<'claim_bid()void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(AuctionCallFactory.claimBid(args, params))
  }

  /**
   * Calls the get_time()uint64 ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public getTime(args: MethodArgs<'get_time()uint64'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(AuctionCallFactory.getTime(args, params))
  }

  /**
   * Extracts a binary state value out of an AppState dictionary
   *
   * @param state The state dictionary containing the state value
   * @param key The key of the state value
   * @returns A BinaryState instance containing the state value, or undefined if the key was not found
   */
  private static getBinaryState(state: AppState, key: string): BinaryState | undefined {
    const value = state[key]
    if (!value) return undefined
    if (!('valueRaw' in value))
      throw new Error(`Failed to parse state value for ${key}; received an int when expected a byte array`)
    return {
      asString(): string {
        return value.value
      },
      asByteArray(): Uint8Array {
        return value.valueRaw
      }
    }
  }

  /**
   * Extracts a integer state value out of an AppState dictionary
   *
   * @param state The state dictionary containing the state value
   * @param key The key of the state value
   * @returns An IntegerState instance containing the state value, or undefined if the key was not found
   */
  private static getIntegerState(state: AppState, key: string): IntegerState | undefined {
    const value = state[key]
    if (!value) return undefined
    if ('valueRaw' in value)
      throw new Error(`Failed to parse state value for ${key}; received a byte array when expected a number`)
    return {
      asBigInt() {
        return typeof value.value === 'bigint' ? value.value : BigInt(value.value)
      },
      asNumber(): number {
        return typeof value.value === 'bigint' ? Number(value.value) : value.value
      },
    }
  }

  /**
   * Returns the smart contract's global state wrapped in a strongly typed accessor with options to format the stored value
   */
  public async getGlobalState(): Promise<Auction['state']['global']> {
    const state = await this.appClient.getGlobalState()
    return {
      get asa_id() {
        return AuctionClient.getIntegerState(state, 'asa_id')
      },
      get auction_end() {
        return AuctionClient.getIntegerState(state, 'auction_end')
      },
      get highest_bid() {
        return AuctionClient.getIntegerState(state, 'highest_bid')
      },
      get winner() {
        return AuctionClient.getBinaryState(state, 'winner')
      },
    }
  }

  public compose(): AuctionComposer {
    const client = this
    const atc = new AtomicTransactionComposer()
    let promiseChain:Promise<unknown> = Promise.resolve()
    const resultMappers: Array<undefined | ((x: any) => any)> = []
    return {
      optinToAsset(args: MethodArgs<'optin_to_asset(pay,asset)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.optinToAsset(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      start(args: MethodArgs<'start(uint64,uint64,axfer)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.start(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      bid(args: MethodArgs<'bid(pay,account)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.bid(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      claimAsset(args: MethodArgs<'claim_asset(asset)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.claimAsset(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      claimBid(args: MethodArgs<'claim_bid()void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.claimBid(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      getTime(args: MethodArgs<'get_time()uint64'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.getTime(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      clearState(args?: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.clearState({...args, sendParams: {...args?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      addTransaction(txn: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>, defaultSender?: SendTransactionFrom) {
        promiseChain = promiseChain.then(async () => atc.addTransaction(await algokit.getTransactionWithSigner(txn, defaultSender ?? client.sender)))
        return this
      },
      async atc() {
        await promiseChain
        return atc
      },
      async execute() {
        await promiseChain
        const result = await algokit.sendAtomicTransactionComposer({ atc, sendParams: {} }, client.algod)
        return {
          ...result,
          returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val.returnValue) : val.returnValue)
        }
      }
    } as unknown as AuctionComposer
  }
}
export type AuctionComposer<TReturns extends [...any[]] = []> = {
  /**
   * Calls the optin_to_asset(pay,asset)void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  optinToAsset(args: MethodArgs<'optin_to_asset(pay,asset)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): AuctionComposer<[...TReturns, MethodReturn<'optin_to_asset(pay,asset)void'>]>

  /**
   * Calls the start(uint64,uint64,axfer)void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  start(args: MethodArgs<'start(uint64,uint64,axfer)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): AuctionComposer<[...TReturns, MethodReturn<'start(uint64,uint64,axfer)void'>]>

  /**
   * Calls the bid(pay,account)void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  bid(args: MethodArgs<'bid(pay,account)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): AuctionComposer<[...TReturns, MethodReturn<'bid(pay,account)void'>]>

  /**
   * Calls the claim_asset(asset)void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  claimAsset(args: MethodArgs<'claim_asset(asset)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): AuctionComposer<[...TReturns, MethodReturn<'claim_asset(asset)void'>]>

  /**
   * Calls the claim_bid()void ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  claimBid(args: MethodArgs<'claim_bid()void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): AuctionComposer<[...TReturns, MethodReturn<'claim_bid()void'>]>

  /**
   * Calls the get_time()uint64 ABI method.
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  getTime(args: MethodArgs<'get_time()uint64'>, params?: AppClientCallCoreParams & CoreAppCallArgs): AuctionComposer<[...TReturns, MethodReturn<'get_time()uint64'>]>

  /**
   * Makes a clear_state call to an existing instance of the auction smart contract.
   *
   * @param args The arguments for the bare call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  clearState(args?: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs): AuctionComposer<[...TReturns, undefined]>

  /**
   * Adds a transaction to the composer
   *
   * @param txn One of: A TransactionWithSigner object (returned as is), a TransactionToSign object (signer is obtained from the signer property), a Transaction object (signer is extracted from the defaultSender parameter), an async SendTransactionResult returned by one of algokit utils helpers (signer is obtained from the defaultSender parameter)
   * @param defaultSender The default sender to be used to obtain a signer where the object provided to the transaction parameter does not include a signer.
   */
  addTransaction(txn: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>, defaultSender?: SendTransactionFrom): AuctionComposer<TReturns>
  /**
   * Returns the underlying AtomicTransactionComposer instance
   */
  atc(): Promise<AtomicTransactionComposer>
  /**
   * Executes the transaction group and returns an array of results
   */
  execute(): Promise<AuctionComposerResults<TReturns>>
}
export type AuctionComposerResults<TReturns extends [...any[]]> = {
  returns: TReturns
  groupId: string
  txIds: string[]
  transactions: Transaction[]
}
