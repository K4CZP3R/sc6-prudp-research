import { Adbuf } from "../helpers/adbuf";
import type { RVConnectionData } from "./rv-connection-data.model";

export class LoginExResponse {
  returnValue: number;
  pidPrincipal: number;
  pbufRespinse: Buffer;
  pConnectionData: RVConnectionData;
  strReturnMsg: string;

  constructor(
    returnValue: number,
    pidPrincipal: number,
    pbufResponse: Buffer,
    pConnectionData: RVConnectionData,
    strReturnMsg: string
  ) {
    this.returnValue = returnValue;
    this.pidPrincipal = pidPrincipal;
    this.pbufRespinse = pbufResponse;
    this.pConnectionData = pConnectionData;
    this.strReturnMsg = strReturnMsg;
  }

  toBuffer() {
    const buf = new Adbuf(Buffer.alloc(0));
    buf.addU32(0);
    buf.addU32(this.pidPrincipal);
    buf.addU32(this.pbufRespinse.length);
    buf.add(this.pbufRespinse);
    const s = this.pConnectionData.urlRegularProtocols;
    buf.addU16(s.length + 1);
    buf.add(Buffer.from(s));
    buf.addU8(0);
    buf.addU32(0);
    buf.addU16(0);
    buf.addU16(0);
    buf.addU16(0x1);
    buf.addU16(0);
    return buf.realBuffer;
  }
}
