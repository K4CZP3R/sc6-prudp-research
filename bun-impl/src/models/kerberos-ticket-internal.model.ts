import type { Adbuf } from "../helpers/adbuf";
import _sodium from "libsodium-wrappers";

const NONCE_BYTES = 24;

export class KerberosTicketInternal {
  principleId: number;
  validUntil: number;
  sessionKey: Buffer;

  constructor(principleId: number, validUntil: number, sessionKey: Buffer) {
    this.principleId = principleId;
    this.validUntil = validUntil;
    this.sessionKey = sessionKey;
  }

  async seal(key: Buffer) {
    await _sodium.ready;
    const sodium = _sodium;
    let nonce = sodium.randombytes_buf(NONCE_BYTES);
    let sealed = sodium.crypto_secretbox_easy(this.sessionKey, nonce, key);
    return Buffer.concat([nonce, sealed]);
  }
}
