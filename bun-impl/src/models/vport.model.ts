import type { Adbuf } from "../helpers/adbuf";
import { colored } from "../helpers/colors";
import { byte, type Byte } from "../helpers/types";
import { StreamType } from "./stream-type.enum";

export class VPort {
  public port: number;
  public streamType: StreamType;

  constructor(buf: Adbuf) {
    const val = buf.readU8();
    this.port = val & 0xf;
    this.streamType = val >> 4;
  }

  toString() {
    return colored(this);
  }

  toJSON() {
    return {
      port: this.port,
      streamType: StreamType[this.streamType],
    };
  }

  toByte(): Byte {
    return byte((this.streamType << 4) | this.port);
  }
}
