import crypto from 'crypto'
import {
  IJsonRpcRequest,
  IJsonRpcResponse,
  IEncryptionPayload
} from '@walletconnect/types'
import {
  convertHexToArrayBuffer,
  convertArrayBufferToBuffer,
  convertUtf8ToBuffer,
  convertBufferToUtf8,
  convertBufferToHex,
  convertHexToBuffer,
  concatBuffers
} from '@walletconnect/utils'

const AES_ALGORITHM = 'AES-256-CBC'
const HMAC_ALGORITHM = 'SHA256'

export function randomBytes (length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, (error: any, result: any) => {
      if (error) {
        reject(error)
      }
      resolve(result)
    })
  })
}

export async function generateKey (length?: number): Promise<ArrayBuffer> {
  const _length = (length || 256) / 8
  const buffer: Buffer = await randomBytes(_length)
  const hex = convertBufferToHex(buffer)
  const result = convertHexToArrayBuffer(hex)

  console.log('result', result)

  return result
}

export async function createHmac (data: Buffer, key: Buffer): Promise<Buffer> {
  const hmac = crypto.createHmac(HMAC_ALGORITHM, key)
  hmac.update(data)
  const hex = hmac.digest('hex')
  console.log('hex')
  const result = convertHexToBuffer(hex)
  console.log('result', result)

  return result
}

export async function verifyHmac (
  payload: IEncryptionPayload,
  key: Buffer
): Promise<boolean> {
  const cipherText: Buffer = convertHexToBuffer(payload.data)
  console.log('cipherText', cipherText)

  const iv: Buffer = convertHexToBuffer(payload.iv)
  console.log('iv', iv)

  const hmac: Buffer = convertHexToBuffer(payload.hmac)
  console.log('hmac', hmac)

  const hmacHex: string = convertBufferToHex(hmac)
  console.log('hmacHex', hmacHex)

  const unsigned: Buffer = concatBuffers(cipherText, iv)
  console.log('unsigned', unsigned)

  const chmac: Buffer = await createHmac(unsigned, key)
  console.log('chmac', chmac)

  const chmacHex: string = convertBufferToHex(chmac)
  console.log('chmacHex', chmacHex)

  if (hmacHex === chmacHex) {
    return true
  }

  return false
}

export async function aesCbcEncrypt (
  data: Buffer,
  key: Buffer,
  iv: Buffer
): Promise<Buffer> {
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv)
  cipher.write(data)
  cipher.end()

  const hex = cipher.final('hex')
  console.log('hex')
  const result = convertHexToBuffer(hex)
  console.log('result', result)

  return result
}

export async function aesCbcDecrypt (
  data: Buffer,
  key: Buffer,
  iv: Buffer
): Promise<Buffer> {
  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv)
  decipher.update(data, 'hex', 'utf8')
  const hex = decipher.final('hex')
  console.log('hex')
  const result = convertHexToBuffer(hex)
  console.log('result', result)

  return result
}

export async function encrypt (
  data: IJsonRpcRequest | IJsonRpcResponse,
  key: ArrayBuffer
): Promise<IEncryptionPayload> {
  const _key: Buffer = convertArrayBufferToBuffer(key)

  const ivArrayBuffer: ArrayBuffer = await generateKey(128)
  const iv: Buffer = convertArrayBufferToBuffer(ivArrayBuffer)
  const ivHex: string = convertBufferToHex(iv)

  const contentString: string = JSON.stringify(data)
  const content: Buffer = convertUtf8ToBuffer(contentString)

  const cipherText: Buffer = await aesCbcEncrypt(content, _key, iv)
  const cipherTextHex: string = convertBufferToHex(cipherText)

  const unsigned: Buffer = concatBuffers(cipherText, iv)
  const hmac: Buffer = await createHmac(unsigned, _key)
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
  const _key: Buffer = convertArrayBufferToBuffer(key)

  if (!_key) {
    throw new Error('Missing key: required for decryption')
  }

  const verified: boolean = await verifyHmac(payload, _key)
  if (!verified) {
    return null
  }

  const cipherText: Buffer = convertHexToBuffer(payload.data)
  const iv: Buffer = convertHexToBuffer(payload.iv)
  const buffer: Buffer = await aesCbcDecrypt(cipherText, _key, iv)
  const utf8: string = convertBufferToUtf8(buffer)
  let data: IJsonRpcRequest
  try {
    data = JSON.parse(utf8)
  } catch (error) {
    throw new Error(`Failed to parse invalid JSON`)
  }

  return data
}
