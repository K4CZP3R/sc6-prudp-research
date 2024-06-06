import type { Adbuf } from "../helpers/adbuf";

export class Request {
  protocolId: number;
  callId: number;
  methodId: number;
  parameters: Buffer;

  constructor(buf: Adbuf) {
    let size = buf.readU32L();
    if (size < buf.length - 4) {
      throw new Error("Missing data");
    }
    this.protocolId = buf.readU8();
    this.protocolId =
      this.protocolId == 0xff ? buf.readU16L() : this.protocolId & 0x7f; // 0x7f or 0x80
    this.callId = buf.readU32L();
    this.methodId = buf.readU32L();
    this.parameters = buf.readNBytes(size - 8);
    console.log("Parameters", this.parameters);
  }
}

class ResponseData {
  callId: number;
  methodId: number;
  data: Buffer;

  constructor(buf: Adbuf) {
    this.callId = buf.readU32();
    this.methodId = buf.readU32();
    this.data = buf.readNBytes(buf.length - 8);
  }
}

class ResponseError {
  errorCode: number;
  callId: number;

  constructor(buf: Adbuf) {
    this.errorCode = buf.readU32();
    this.callId = buf.readU32();
  }
}

export class Response {
  protocolId: number;
  result: ResponseData | ResponseError;

  constructor(buf: Adbuf) {
    let _size = buf.readU32L();
    this.protocolId = buf.readU8();
    this.protocolId =
      this.protocolId == 0x7f ? buf.readU16L() : this.protocolId;

    let status = buf.readU8();
    if (status === 0) {
      this.result = new ResponseError(buf);
    } else if (status === 1) {
      this.result = new ResponseData(buf);
    } else {
      throw new Error("Invalid status");
    }
  }
}

export function getPacket(buf: Adbuf): Request | Response {
  console.log(buf.realBuffer);
  if (buf.length < 5) {
    throw new Error("Missing data");
  }

  if ((buf.readU8At(4) & 0x80) === 0) {
    return new Response(buf.clone());
  } else {
    return new Request(buf.clone());
  }
}
