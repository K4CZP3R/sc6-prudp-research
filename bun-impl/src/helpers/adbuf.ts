export class Adbuf {
  private currentOffset: number = 0;
  constructor(private buf: Buffer) {}

  public get length() {
    return this.buf.length;
  }
  public get offset() {
    return this.currentOffset;
  }
  public set offset(offset: number) {
    this.currentOffset = offset;
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
    let subbuf = Buffer.alloc(1);
    subbuf.writeUInt8(val, 0);
    this.buf = Buffer.concat([this.buf, subbuf]);
  }

  addU16(val: number) {
    let subbuf = Buffer.alloc(2);
    subbuf.writeUInt16BE(val, 0);
    this.buf = Buffer.concat([this.buf, subbuf]);
  }
  addU16L(val: number) {
    let subbuf = Buffer.alloc(2);
    subbuf.writeUInt16LE(val, 0);
    this.buf = Buffer.concat([this.buf, subbuf]);
  }
  addU32(val: number) {
    let subbuf = Buffer.alloc(4);
    subbuf.writeUInt32BE(val, 0);
    this.buf = Buffer.concat([this.buf, subbuf]);
  }
  addU32L(val: number) {
    let subbuf = Buffer.alloc(4);
    subbuf.writeUInt32LE(val, 0);
    this.buf = Buffer.concat([this.buf, subbuf]);
  }

  subarray(start: number, end: number) {
    return this.buf.subarray(start, end);
  }

  readU8() {
    const result = this.buf.readUInt8(this.currentOffset);
    this.currentOffset += 1;
    return result;
  }
  readI8() {
    const result = this.buf.readInt8(this.currentOffset);
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

  readU16() {
    const result = this.buf.readUInt16BE(this.currentOffset);
    this.currentOffset += 2;
    return result;
  }

  readI16() {
    const result = this.buf.readInt16BE(this.currentOffset);
    this.currentOffset += 2;
    return result;
  }

  readI32() {
    const result = this.buf.readInt32BE(this.currentOffset);
    this.currentOffset += 4;
    return result;
  }
  readI64() {
    const result = this.buf.readBigInt64BE(this.currentOffset);
    this.currentOffset += 8;
    return result;
  }

  readFloat32() {
    const result = this.buf.readFloatBE(this.currentOffset);
    this.currentOffset += 4;
    return result;
  }

  readFloat64() {
    const result = this.buf.readDoubleBE(this.currentOffset);
    this.currentOffset += 8;
    return result;
  }

  readU32() {
    const result = this.buf.readUInt32BE(this.currentOffset);
    this.currentOffset += 4;
    return result;
  }

  readU64() {
    const result = this.buf.readBigUint64BE(this.currentOffset);
    this.currentOffset += 8;
    return result;
  }

  readNBytes(n: number) {
    const result = this.buf.subarray(
      this.currentOffset,
      this.currentOffset + n
    );
    this.currentOffset += n;
    return result;
  }

  readString() {
    let length = this.readU16L();
    let bytes = this.readNBytes(length);
    return bytes.toString("utf-8").replace(/\0/g, "");
  }

  readU8At(index: number) {
    return this.buf.readUInt8(index);
  }

  toString() {
    return this.buf.toString("hex");
  }
}
