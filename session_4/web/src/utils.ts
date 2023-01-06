import algosdk from 'algosdk'

export module Utils {
    interface StateValue {
        action: number,
        bytes?: string
        uint?: number
    }

    interface State {
        key: string
        value: StateValue
    }

    interface ReadableStateValue {
      type: 'int' | 'bytes',
      raw: Uint8Array,
      number?: number,
      string?: string,
      address?: string
    }

    interface ReadableState {
        [key: string]: ReadableStateValue
    }

    export function getReadableState (delta: Array<State>) {
      const r = {} as ReadableState

      delta.forEach(d => {
        const key = Buffer.from(d.key, 'base64').toString('utf8')
        let value: ReadableStateValue

        if (d.value.bytes) {
          const raw = new Uint8Array(Buffer.from(d.value.bytes as string, 'base64'))
          const utf8 = Buffer.from(d.value.bytes as string, 'base64').toString()

          value = { type: 'bytes', raw, string: utf8 }

          const address = algosdk.encodeAddress(raw)
          if (algosdk.isValidAddress(address)) value.address = address
        } else {
          const numberValue = d.value.uint as number
          value = { type: 'int', raw: algosdk.encodeUint64(numberValue), number: numberValue }
        }

        r[key] = value
      })

      return r
    }
}

export default Utils
