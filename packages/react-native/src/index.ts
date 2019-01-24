import Connector from '@walletconnect/core'
import {
  IWalletConnectOptions,
  INativeWalletOptions,
  IPushServerOptions,
  IClientDetails
} from '@walletconnect/types'
import * as cryptoLib from './nativeCrypto'

class RNWalletConnect extends Connector {
  constructor (
    opts: IWalletConnectOptions,
    walletOptions: INativeWalletOptions
  ) {
    super(cryptoLib, opts, walletOptions.clientMeta)
    if (walletOptions.push) {
      this.registerPushServer(walletOptions.push)
    }
  }

  private registerPushServer (push: IPushServerOptions) {
    if (!push.url || typeof push.url !== 'string') {
      throw Error('Invalid or missing push.url parameter value')
    }

    if (!push.type || typeof push.type !== 'string') {
      throw Error('Invalid or missing push.type parameter value')
    }

    if (!push.token || typeof push.token !== 'string') {
      throw Error('Invalid or missing push.token parameter value')
    }

    const clientDetails: IClientDetails = {
      type: push.type,
      token: push.token,
      peerName: '',
      language: push.language || ''
    }

    this.on('connect', (error, payload) => {
      if (error) {
        throw error
      }

      if (push.peerMeta) {
        const peerName = payload.params[0].peerMeta.name
        clientDetails.peerName = peerName
      }

      this.postClientDetails(push.url, clientDetails)
    })
  }

  private async postClientDetails (url: string, clientDetails: IClientDetails) {
    try {
      const response = await fetch(`${url}/new`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientDetails)
      })

      const json = await response.json()
      if (!json.success) {
        throw Error('Failed to register push server')
      }
    } catch (error) {
      console.error(error)
      throw Error('Failed to register push server')
    }
  }
}

export default RNWalletConnect
