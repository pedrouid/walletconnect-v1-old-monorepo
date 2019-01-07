import WalletConnect from '@walletconnect/browser'
import Subprovider from './subprovider'

export default class WalletConnectSubprovider extends Subprovider {
  constructor (opts) {
    super()

    this._walletconnect = new WalletConnect(opts)
  }

  set isWalletConnect (value) {}

  get isWalletConnect () {
    return true
  }

  set connected (value) {}

  get connected () {
    return this._walletconnect.connected
  }

  set uri (value) {}

  get uri () {
    return this._walletconnect.uri
  }

  set accounts (value) {}

  get accounts () {
    return this._walletconnect.accounts
  }

  async createSession () {
    const result = await this._walletconnect.createSession()
    return result
  }

  setEngine (engine) {
    this.engine = engine
    this.engine.walletconnect = this
    this.engine.isWalletConnect = this.isWalletConnect
  }

  async handleRequest (payload, next, end) {
    switch (payload.method) {
      case 'eth_accounts':
        end(null, this.accounts)
        return
      case 'eth_signTransaction':
      case 'eth_sendTransaction':
      case 'eth_sendRawTransaction':
      case 'eth_sign':
      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v3':
      case 'personal_sign':
        try {
          const result = await this._walletconnect._sendRequest(payload)
          end(null, result.result)
        } catch (err) {
          end(err)
        }
        return
      default:
        next()
    }
  }
  sendAsync (payload, callback) {
    const next = () => {
      const sendAsync = this.engine.sendAsync.bind(this)
      sendAsync(payload, callback)
    }
    const end = (err, data) => {
      return err ? callback(err) : callback(null, { ...payload, result: data })
    }
    this.handleRequest(payload, next, end)
  }
}
