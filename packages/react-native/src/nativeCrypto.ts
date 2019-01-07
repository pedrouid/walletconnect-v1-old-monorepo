// import { NativeModules } from 'react-native'
// import crypto from 'react-native-fast-crypto'
// import base64 from 'base64-js'
import {
  IJsonRpcRequest,
  IJsonRpcResponse,
  IEncryptionPayload
} from '@walletconnect/types'

// crypto.randomBytes = (size: number, cb: any) => {
//   const { randomBytes } = NativeModules.RNRandomBytes
//   if (cb) {
//     randomBytes(size, cb)
//     return
//   }
//   return new Promise((resolve, reject) => {
//     randomBytes(size, (error: any, b: any) => {
//       if (error) {
//         reject(error)
//       }
//       console.log('randomBytes bytes', b) // tslint:disable-line
//       const result = base64.toByteArray(b).buffer
//       resolve(result)
//     })
//   })
// }

const nativeCrypto = {
  generateKey: async (length?: number) => {
    const result: ArrayBuffer = new ArrayBuffer(0)
    return result
  },
  encrypt: async (
    data: IJsonRpcRequest | IJsonRpcResponse,
    key: ArrayBuffer
  ) => {
    const result: IEncryptionPayload = {
      data: '',
      hmac: '',
      iv: ''
    }
    return result
  },
  decrypt: async (payload: IEncryptionPayload, key: ArrayBuffer) => {
    return null
  }
}

export default nativeCrypto
