export class Adbuf {
  private currentOffset: number = 0;
  constructor(private buf: Buffer) {}

  public get length() {
    return this.buf.length;
  }

  public get offset() {
    return this.currentOffset;
  }

  public get realBuffer() {
    return this.buf;
  }

  clone() {
    return new Adbuf(this.buf);
  }

  add(buf: Buffer) {
    this.buf = Buffer.concat([this.buf, buf]);
  }
  addU8(val: number) {
    this.buf = Buffer.concat([this.buf, Buffer.from([val])]);
  }
  addU16L(val: number) {
    this.buf = Buffer.concat([this.buf, Buffer.from([val])]);
  }
  addU32L(val: number) {
    this.buf = Buffer.concat([this.buf, Buffer.from([val])]);
  }

  subarray(start: number, end: number) {
    return this.buf.subarray(start, end);
  }

  readU8() {
    const result = this.buf.readUInt8(this.currentOffset);
    this.currentOffset += 1;
    return result;
  }
  readU32L() {
    const result = this.buf.readUInt32LE(this.currentOffset);
    this.currentOffset += 4;
    return result;
  }

  readU16L() {
    const result = this.buf.readUInt16LE(this.currentOffset);
    this.currentOffset += 2;
    return result;
  }

  readU8At(index: number) {
    return this.buf.readUInt8(index);
  }
}
