import { PacketType } from "./packet-type.enum";
import { PacketFlag, PacketFlags } from "./bit-flags.model";
import { VPort } from "./vport.model";
import { cryptKey } from "../helpers/crypt";
import { StreamType } from "./stream-type.enum";
import { Adbuf } from "../helpers/adbuf";
import pako from "pako";
import { colored, colors } from "../helpers/colors";
import { byte } from "../helpers/types";

function getChecksumKey(streamType: StreamType) {
  const accessKey = "yl4NG7qZ";
  function sum() {
    let keySum = 0;
    for (const char of accessKey) {
      keySum += char.charCodeAt(0);
    }
    return keySum;
  }

  switch (streamType) {
    case StreamType.DO:
    case StreamType.RV:
    case StreamType.SBMGMT:
    case StreamType.NAT:
    case StreamType.SessionDiscovery:
    case StreamType.NATEcho:
    case StreamType.Routing:
      return 0;
    case StreamType.RVSec:
      return sum();
  }
}

export class QPacket {
  source: VPort;
  destination: VPort;
  typeFlag: number;
  packetType: PacketType;
  flags: PacketFlags;
  sessionId: number;
  signature: number;
  sequence: number;
  connSignatue?: number;
  fragmentId?: number;
  payloadSize?: number;
  payload?: Buffer;
  checksum: number;
  useCompression: boolean;

  static fromBytes(buf: Adbuf): [QPacket, number] {
    return [new QPacket(buf), buf.offset];
  }

  toString() {
    return colored(this, {
      exlucdeProps: [
        "sourceBuf",
        "typeFlag",
        "packetType",
        "source",
        "destination",
        "payload",
      ],
      customProps: [
        // {
        //   key: "source",
        //   value:
        //     this.source.port === 15
        //       ? "client"
        //       : this.source.port === 1
        //       ? "server"
        //       : this.source.port.toString(),
        // },
        // {
        //   key: "destination",
        //   value:
        //     this.destination.port === 15
        //       ? "client"
        //       : this.destination.port === 1
        //       ? "server"
        //       : this.destination.port.toString(),
        // },
        { key: "packetType", value: PacketType[this.packetType] },
        { key: "payload", value: this.payload?.toString("hex") ?? "" },
      ],
    });
  }

  toJSON() {
    return {
      source: this.source.toJSON(),
      destination: this.destination.toJSON(),
      typeFlag: this.typeFlag,
      packetType: PacketType[this.packetType],
      flags: this.flags.toJSON(),
      sessionId: this.sessionId,
      signature: this.signature,
      sequence: this.sequence,
      connSignatue: this.connSignatue,
      fragmentId: this.fragmentId,
      payloadSize: this.payloadSize,
      payload: this.payload,
      checksum: this.checksum,
      useCompression: this.useCompression,
    };
  }

  clone() {
    return new QPacket(this.sourceBuf.clone());
  }

  constructor(public sourceBuf: Adbuf) {
    this.source = new VPort(sourceBuf);
    this.destination = new VPort(sourceBuf);
    this.typeFlag = sourceBuf.readU8();
    this.packetType = this.typeFlag & 0x7;
    this.flags = new PacketFlags(this.typeFlag >> 3);
    this.sessionId = sourceBuf.readU8();
    this.signature = sourceBuf.readU32L();
    this.sequence = sourceBuf.readU16L();

    switch (this.packetType) {
      case PacketType.Syn:
      case PacketType.Connect:
        this.connSignatue = sourceBuf.readU32L();
        break;
      case PacketType.Data:
        this.fragmentId = sourceBuf.readU8();
        break;
    }

    if (this.flags.includes(PacketFlag.HasSize)) {
      this.payloadSize = sourceBuf.readU16L();
    } else {
      let l = sourceBuf.length;
      let p = sourceBuf.offset;
      this.payloadSize = l - p - 1;
    }

    this.payload = sourceBuf.subarray(
      sourceBuf.offset,
      sourceBuf.offset + this.payloadSize
    );

    if (
      this.packetType !== PacketType.Syn &&
      this.source.streamType === StreamType.RVSec
    ) {
      this.payload = cryptKey(Buffer.from("CD&ML"), this.payload);
      this.useCompression = this.payload.length > 0 && this.payload.at(0) !== 0;
      if (this.useCompression) {
        this.payload = Buffer.from(pako.inflate(this.payload.subarray(1)));
      } else {
        this.payload = this.payload.subarray(1);
      }
    } else {
      this.useCompression = false;
    }

    sourceBuf.offset = sourceBuf.offset + this.payloadSize;

    this.checksum = sourceBuf.readU8();
  }

  public toBuffer() {
    let data = this.toDataBuffer();
    data.addU8(
      // changed from 16LE to 8
      this.calcChecksumFromData(
        getChecksumKey(this.destination.streamType),
        data.realBuffer
      )
    );
    return data;
  }

  public toDataBuffer() {
    let data = new Adbuf(Buffer.from([]));
    data.addU8(this.source.toByte());
    data.addU8(this.destination.toByte());
    const typeFlag = byte(this.packetType | (this.flags.bits << 3));
    data.addU8(typeFlag);
    data.addU8(byte(this.sessionId));

    // Convert signature to LE bytes
    const signature = Buffer.alloc(4);
    signature.writeUInt32LE(this.signature, 0);
    data.add(signature);

    // Convert sequence to LE bytes
    const sequence = Buffer.alloc(2);
    sequence.writeUInt16LE(this.sequence, 0);

    data.add(sequence);

    switch (this.packetType) {
      case PacketType.Syn:
      case PacketType.Connect:
        // Convert connSignature to LE bytes
        const connSignature = Buffer.alloc(4);
        connSignature.writeUInt32LE(this.connSignatue!, 0);
        data.add(connSignature);
        break;
      case PacketType.Data:
        data.addU8(this.fragmentId!);
        break;
    }

    let payload = Buffer.from([]);
    if (this.useCompression) {
      const compressed = Buffer.from(pako.inflate(this.payload!));
      // Insert at compressed index 0
      payload = Buffer.concat([
        Buffer.from([this.payload!.length / compressed.length + 1]),
        compressed,
      ]);
    } else {
      payload = this.payload!;
    }

    if (
      this.packetType !== PacketType.Syn &&
      this.source.streamType === StreamType.RVSec
    ) {
      payload = cryptKey(Buffer.from("CD&ML"), payload);
    }

    if (this.flags.includes(PacketFlag.HasSize)) {
      // Get payload size as u16
      let s = payload.length;
      // Save it as u16 le bytes
      let sBuf = Buffer.alloc(2);

      sBuf.writeUInt16BE(s, 0);
      data.add(sBuf);
    }

    data.add(payload);
    return data;
  }

  validate(buf: Adbuf) {
    const shouldBe = this.calcChecksumFromData(
      getChecksumKey(this.destination.streamType),
      buf.realBuffer
    );
    if (shouldBe !== this.checksum) {
      console.warn(
        `WARN: Checksum is ${this.checksum} and generated one is ${shouldBe}`
      );
    }
  }

  /**
   * Calculates checksum from data using a given key.
   * @param key The key as a number.
   * @param data The data buffer.
   * @returns The calculated checksum as a number.
   */
  calcChecksumFromData(key: number, data: Buffer): number {
    let l = data.length;
    l = l - (l % 4); // Adjust length to be a multiple of
    let sum = 0;

    // Sum all 32-bit chunks
    for (let i = 0; i < l; i += 4) {
      sum += data.readUInt32LE(i);
    }

    // Convert sum to 32-bit unsigned integer
    sum = sum >>> 0;

    // Convert the sum to bytes and sum them
    let dataSum = 0;
    for (let i = 0; i < 4; i++) {
      dataSum += (sum >> (i * 8)) & 0xff;
    }

    // Sum the remaining bytes in the data
    let trailerSum = 0;
    for (let i = l; i < data.length; i++) {
      trailerSum += data[i];
    }

    // Add key to the sum of the data bytes and trailer bytes
    let result = (dataSum + key + trailerSum) & 0xff; // Ensure result is a byte
    return result;
  }
}
