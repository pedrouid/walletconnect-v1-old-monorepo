import { NativeModules } from "react-native";
import crypto from "react-native-fast-crypto";
import base64 from "base64-js";

const nativeCrypto = crypto;

nativeCrypto.randomBytes = (size: number, cb: any) => {
  const { randomBytes } = NativeModules.RNRandomBytes;
  if (cb) {
    randomBytes(size, cb);
    return;
  }
  return new Promise((resolve, reject) => {
    randomBytes(size, (error: any, b: any) => {
      if (error) {
        reject(error);
      }
      console.log("randomBytes bytes", b); // tslint:disable-line
      const result = base64.toByteArray(b).buffer;
      resolve(result);
    });
  });
};

export default nativeCrypto;
