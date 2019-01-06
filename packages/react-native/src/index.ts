import Connector from '@walletconnect/core'
import { IWalletConnectOptions } from '@walletconnect/typings'
import cryptoLib from './nativeCrypto'

class RNWalletConnect extends Connector {
  constructor (opts: IWalletConnectOptions) {
    super(cryptoLib, opts)
  }
}

export default RNWalletConnect
