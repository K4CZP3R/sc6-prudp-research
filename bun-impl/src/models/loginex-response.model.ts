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
}
