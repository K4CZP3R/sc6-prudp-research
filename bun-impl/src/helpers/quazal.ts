import type { Adbuf } from "./adbuf";

export class QuazalHelpers {
  static readString(buf: Adbuf) {
    let length = buf.readU16L();
    let result = buf.readNBytes(length - 1);
    buf.readU8();
    return result.toString("utf-8");
  }

  static writeString(buf: Adbuf, v?: string) {
    if (v) {
      buf.addU16L(v.length + 1);
      for (let i = 0; i < v.length; i++) {
        buf.addU8(v.charCodeAt(i));
      }
      buf.addU8(0);
    } else {
      buf.addU8(1);
      buf.addU8(0);
      buf.addU8(0);
    }
  }
}
