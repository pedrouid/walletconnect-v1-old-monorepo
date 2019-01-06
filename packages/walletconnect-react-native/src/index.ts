import Connector from "walletconnect-core";
import * as cryptoLib from "./nativeCrypto";
import { IWalletConnectOptions } from "../../../typings";

class RNWalletConnect extends Connector {
  constructor(opts: IWalletConnectOptions) {
    super(cryptoLib, opts);
  }
}

export default RNWalletConnect;
