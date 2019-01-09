import { NativeModules } from 'react-native'
import crypto from 'react-native-fast-crypto'
import base64 from 'base64-js'
import {
  IJsonRpcRequest,
  IJsonRpcResponse,
  IEncryptionPayload
} from '@walletconnect/types'
import {
  convertUtf8ToBuffer,
  convertBufferToHex,
  convertHexToBuffer,
  convertBufferToUtf8,
  concatBuffers
} from '@walletconnect/utils'

const AES_ALGORITHM = 'AES-256-CBC'
const HMAC_ALGORITHM = 'SHA256'

export function randomBytes (length: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    NativeModules.RNRandomBytes.randomBytes(length, (error: any, b: any) => {
      if (error) {
        reject(error)
      }
      console.log('randomBytes bytes', b) // tslint:disable-line
      const result = base64.toByteArray(b).buffer
      resolve(result)
    })
  })
}

export async function generateKey (length?: number) {
  const _length = (length || 256) / 8
  const result: ArrayBuffer = await randomBytes(_length)
  return result
}

export async function createHmac (
  data: ArrayBuffer,
  key: ArrayBuffer
): Promise<ArrayBuffer> {
  const hmac = crypto.createHmac(HMAC_ALGORITHM, key)
  hmac.update(data)
  const signature = hmac.read()

  return signature
}

export async function verifyHmac (
  payload: IEncryptionPayload,
  key: ArrayBuffer
): Promise<boolean> {
  const cipherText: ArrayBuffer = convertHexToBuffer(payload.data)
  const iv: ArrayBuffer = convertHexToBuffer(payload.iv)
  const hmac: ArrayBuffer = convertHexToBuffer(payload.hmac)
  const hmacHex: string = convertBufferToHex(hmac)

  const unsigned: ArrayBuffer = concatBuffers(cipherText, iv)
  const chmac: ArrayBuffer = await createHmac(unsigned, key)
  const chmacHex: string = convertBufferToHex(chmac)

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
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv)
  cipher.write(data)
  cipher.end()

  const cipherText = cipher.read()

  return cipherText
}

export async function aesCbcDecrypt (
  data: ArrayBuffer,
  key: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  const decryptor = crypto.createDecipheriv(AES_ALGORITHM, key, iv)
  decryptor.update(data, 'hex', 'utf8')
  const result = decryptor.read()
  return result
}

export async function encrypt (
  data: IJsonRpcRequest | IJsonRpcResponse,
  key: ArrayBuffer
) {
  // use custom iv or generate one
  const iv: ArrayBuffer = await generateKey(128)
  const ivHex: string = convertBufferToHex(iv)

  const contentString: string = JSON.stringify(data)
  const content: ArrayBuffer = convertUtf8ToBuffer(contentString)

  const cipherText: ArrayBuffer = await aesCbcEncrypt(content, key, iv)
  const cipherTextHex: string = convertBufferToHex(cipherText)

  const unsigned: ArrayBuffer = concatBuffers(cipherText, iv)
  const hmac: ArrayBuffer = await createHmac(unsigned, key)
  const hmacHex: string = convertBufferToHex(hmac)

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

  const cipherText: ArrayBuffer = convertHexToBuffer(payload.data)
  const iv: ArrayBuffer = convertHexToBuffer(payload.iv)
  const buffer: ArrayBuffer = await aesCbcDecrypt(cipherText, key, iv)
  const utf8: string = convertBufferToUtf8(buffer)
  let data: IJsonRpcRequest
  try {
    data = JSON.parse(utf8)
  } catch (error) {
    throw new Error(`Failed to parse invalid JSON`)
  }

  return data
}
