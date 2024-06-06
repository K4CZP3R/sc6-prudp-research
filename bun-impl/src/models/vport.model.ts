import type { Adbuf } from "../helpers/adbuf";
import { StreamType } from "./stream-type.enum";

export class VPort {
  public port: number;
  public streamType: StreamType;

  constructor(buf: Adbuf) {
    const val = buf.readU8();
    this.port = val & 0xf;
    this.streamType = val >> 4;
  }

  toJSON() {
    return {
      port: this.port,
      streamType: StreamType[this.streamType],
    };
  }

  toBuffer(): Buffer {
    // Convert streamType to u8
    const streamType = (this.streamType << 4) | this.port;
    return Buffer.from([streamType]);
  }
}
