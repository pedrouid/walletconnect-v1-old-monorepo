import RNSimpleCrypto from 'react-native-simple-crypto'

import {
  IJsonRpcRequest,
  IJsonRpcResponse,
  IEncryptionPayload
} from '@walletconnect/types'
import {
  convertHexToArrayBuffer,
  convertArrayBufferToHex,
  convertUtf8ToArrayBuffer,
  convertArrayBufferToUtf8,
  concatArrayBuffers
} from '@walletconnect/utils'

export async function generateKey (length?: number): Promise<ArrayBuffer> {
  const _length = (length || 256) / 8
  const buffer: ArrayBuffer = await RNSimpleCrypto.utils.randomBytes(_length)
  const hex = convertArrayBufferToHex(buffer)
  const result = convertHexToArrayBuffer(hex)

  console.log('result', result)

  return result
}

export async function createHmac (
  data: ArrayBuffer,
  key: ArrayBuffer
): Promise<ArrayBuffer> {
  const result = await RNSimpleCrypto.HMAC.hmac256(data, key)
  return result
}

export async function verifyHmac (
  payload: IEncryptionPayload,
  key: ArrayBuffer
): Promise<boolean> {
  const cipherText: ArrayBuffer = convertHexToArrayBuffer(payload.data)
  const iv: ArrayBuffer = convertHexToArrayBuffer(payload.iv)
  const hmac: ArrayBuffer = convertHexToArrayBuffer(payload.hmac)
  const hmacHex: string = convertArrayBufferToHex(hmac)
  const unsigned: ArrayBuffer = concatArrayBuffers(cipherText, iv)
  const chmac: ArrayBuffer = await createHmac(unsigned, key)
  const chmacHex: string = convertArrayBufferToHex(chmac)
  if (hmacHex === chmacHex) {
    return true
  }

  return false
}

export async function aesCbcEncrypt (
  data: ArrayBuffer,
  key: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  const result = await RNSimpleCrypto.AES.encrypt(data, key, iv)
  return result
}

export async function aesCbcDecrypt (
  data: ArrayBuffer,
  key: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  const result = await RNSimpleCrypto.AES.decrypt(data, key, iv)
  return result
}

export async function encrypt (
  data: IJsonRpcRequest | IJsonRpcResponse,
  key: ArrayBuffer
): Promise<IEncryptionPayload> {
  const iv: ArrayBuffer = await generateKey(128)
  const ivHex: string = convertArrayBufferToHex(iv)

  const contentString: string = JSON.stringify(data)
  const content: ArrayBuffer = convertUtf8ToArrayBuffer(contentString)

  const cipherText: ArrayBuffer = await aesCbcEncrypt(content, key, iv)
  const cipherTextHex: string = convertArrayBufferToHex(cipherText)

  const unsigned: ArrayBuffer = concatArrayBuffers(cipherText, iv)
  const hmac: ArrayBuffer = await createHmac(unsigned, key)
  const hmacHex: string = convertArrayBufferToHex(hmac)

  return {
    data: cipherTextHex,
    hmac: hmacHex,
    iv: ivHex
  }
}

export async function decrypt (
  payload: IEncryptionPayload,
  key: ArrayBuffer
): Promise<IJsonRpcRequest | IJsonRpcResponse | null> {
  if (!key) {
    throw new Error('Missing key: required for decryption')
  }

  const verified: boolean = await verifyHmac(payload, key)
  if (!verified) {
    return null
  }

  const cipherText: ArrayBuffer = convertHexToArrayBuffer(payload.data)
  const iv: ArrayBuffer = convertHexToArrayBuffer(payload.iv)
  const buffer: ArrayBuffer = await aesCbcDecrypt(cipherText, key, iv)
  const utf8: string = convertArrayBufferToUtf8(buffer)
  let data: IJsonRpcRequest
  try {
    data = JSON.parse(utf8)
  } catch (error) {
    throw new Error(`Failed to parse invalid JSON`)
  }

  return data
}
