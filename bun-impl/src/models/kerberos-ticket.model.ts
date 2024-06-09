import { Adbuf } from "../helpers/adbuf";
import { cryptKey } from "../helpers/crypt";
import { QuazalHelpers } from "../helpers/quazal";
import type { KerberosTicketInternal } from "./kerberos-ticket-internal.model";
import crypto from "crypto";

export class KerberosTicket {
  sessionKey: Buffer; // 16
  pid: number;
  internal: KerberosTicketInternal;

  constructor(
    sessionKey: Buffer,
    pid: number,
    internal: KerberosTicketInternal
  ) {
    this.sessionKey = sessionKey;
    this.pid = pid;
    this.internal = internal;
  }

  static fromBuffer(buf: Adbuf) {
    throw new Error("Not implemented");
  }

  deriveKey(peerPid: number, password?: string): Buffer {
    let count = 65000 + (peerPid % 1024);
    let key = Buffer.from(password ?? "UbiDummyPwd");

    for (let i = 0; i < count; i++) {
      const hash = crypto.createHash("md5");
      hash.update(key);
      key = hash.digest();
    }

    return key;
  }

  async toBuffer(peerPid: number, key: Buffer, password?: string) {
    let result = new Adbuf(Buffer.alloc(0));
    result.add(this.sessionKey);
    result.addU32(this.pid);
    result.add(await this.internal.seal(key));

    let derivedKey = this.deriveKey(peerPid, password);
    let buf = cryptKey(derivedKey, result.realBuffer);
    let md5Hmac = crypto.createHmac("md5", derivedKey);
    md5Hmac.update(buf);
    let hmac = md5Hmac.digest();
    result.add(hmac);

    return result.realBuffer;
  }
}
