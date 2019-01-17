import Connector from '@walletconnect/core'
import { IWalletConnectOptions, IClientMeta } from '@walletconnect/types'
import * as cryptoLib from './nativeCrypto'

class RNWalletConnect extends Connector {
  constructor (opts: IWalletConnectOptions, clientMeta: IClientMeta) {
    super(cryptoLib, opts, clientMeta)
  }
}

export default RNWalletConnect
