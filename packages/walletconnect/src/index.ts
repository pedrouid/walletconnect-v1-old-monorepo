import Connector from "walletconnect-core";
import * as cryptoLib from "./webCrypto";
import { IWalletConnectOptions } from "../../../typings";

class WalletConnect extends Connector {
  constructor(opts: IWalletConnectOptions) {
    super(cryptoLib, opts);
  }
}

export default WalletConnect;
