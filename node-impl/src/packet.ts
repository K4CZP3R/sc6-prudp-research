import { IPacketHeader } from "./raw-packet.js";
import struct from "python-struct"
import { packetDescribe } from "./helpers/describe.helper.js";

export interface IPacket {
    source: PacketLocation,
    destination: PacketLocation,
    type: PacketType;
    flags: PacketFlag[];
    session_id: number;
    packet_signature: number;
    sequence_id: number;
    packet_specific_data?: IPacketSpecificData;
    payload: Buffer;
    checksum: number;
}


export class Packet implements IPacket {
    source: PacketLocation;
    destination: PacketLocation;
    type: PacketType;
    flags: PacketFlag[];
    session_id: number;
    packet_signature: number;
    sequence_id: number;
    packet_specific_data?: IPacketSpecificData;
    payload: Buffer;
    checksum: number;
    data: Buffer

    static fromHeaderAndBuffer(header: IPacketHeader, rawData: Buffer) {
        let packet_specific_data: IPacketSpecificData | undefined = undefined;
        let afterSpecificData: Buffer | undefined = undefined;
        let type = getPacketType(header.type_and_flags);
        let flags = getPacketFlags(header.type_and_flags);
        if (type === "syn" || type === "connect") {
            packet_specific_data = {
                type: "connection-signature",
                data: rawData.readUInt32BE(0xA)
            }
            afterSpecificData = rawData.slice(0xA + 4);
        } else if (type === "data") {
            packet_specific_data = {
                type: "fragment-id",
                data: rawData.readUint8(0xA)
            }
            afterSpecificData = rawData.slice(0xA + 1);
        } else if (flags.includes("has-size")) {
            packet_specific_data = {
                type: "payload-size",
                data: rawData.readUint16BE(0xA)
            }
            afterSpecificData = rawData.slice(0xA + 2);
        }
        else {
            packet_specific_data = undefined;
            afterSpecificData = rawData.slice(0xA);
        }

        // Remove last byte from payload
        let checksum = afterSpecificData[afterSpecificData.length - 1];
        let payload = afterSpecificData.slice(0, afterSpecificData.length - 1);

        let potentialPacket = new Packet(header.source, header.destination, type, getPacketFlags(header.type_and_flags), header.session_id, header.packet_signature, header.sequence_id, packet_specific_data, payload, checksum);

        // Check if rawData is equal to the buffer generated by toBuffer()
        let generatedBuf = potentialPacket.toBuffer();
        if (generatedBuf.length !== rawData.length) throw new Error("Generated buffer length does not match raw data length!" + generatedBuf.length + "vs" + rawData.length);
        for (let i = 0; i < generatedBuf.length; i++) {
            if (generatedBuf[i] !== rawData[i]) throw new Error("Generated buffer does not match raw data!");
        }
        return potentialPacket;
    }

    constructor(source: PacketLocation, destination: PacketLocation, type: PacketType, flags: PacketFlag[], sessionId: number, packetSignature: number, sequenceId: number, packetSpecificData?: IPacketSpecificData, payload?: Buffer, checksum?: number) {
        this.source = source;
        this.destination = destination;
        this.type = type;
        this.flags = flags;
        this.session_id = sessionId;
        this.packet_signature = packetSignature;
        this.sequence_id = sequenceId;

        this.packet_specific_data = packetSpecificData;
        this.payload = payload || Buffer.alloc(0);
        this.checksum = checksum || 0;
    }

    toBuffer(): Buffer {

        let locationBuf = Buffer.from([this.source, this.destination]);
        if (locationBuf.length !== 2) throw new Error("Invalid location buffer length!");
        let typeAndFlagsBuf = Buffer.from([toTypeAndFlag(this.type, this.flags)]);
        if (typeAndFlagsBuf.length !== 1) throw new Error("Invalid type and flags buffer length!");

        let sessionIdBuf = Buffer.from([this.session_id]);
        if (sessionIdBuf.length !== 1) throw new Error("Invalid session id buffer length!");

        // Pad packet signature to 4 bytes and convert to buffer
        let packetSignatureBuf = Buffer.alloc(4);
        packetSignatureBuf.writeUInt32BE(this.packet_signature);
        if (packetSignatureBuf.length !== 4) throw new Error("Invalid packet signature buffer length!");

        // Pad sequence id to 2 bytes and convert to buffer
        let sequenceIdBuf = Buffer.alloc(2);
        sequenceIdBuf.writeUInt16BE(this.sequence_id);
        if (sequenceIdBuf.length !== 2) throw new Error("Invalid sequence id buffer length!");

        let headerBuf = Buffer.concat([locationBuf, typeAndFlagsBuf, sessionIdBuf, packetSignatureBuf, sequenceIdBuf]);


        let packetSpecificDatabuf = Buffer.alloc(0);
        if (this.packet_specific_data) {
            if (this.packet_specific_data.type === "connection-signature") {
                packetSpecificDatabuf = Buffer.alloc(4);
                packetSpecificDatabuf.writeUInt32BE(this.packet_specific_data.data);
            } else if (this.packet_specific_data.type === "fragment-id") {
                packetSpecificDatabuf = Buffer.alloc(1);
                packetSpecificDatabuf.writeUInt8(this.packet_specific_data.data);
            } else if (this.packet_specific_data.type == "payload-size") {
                packetSpecificDatabuf = Buffer.alloc(2);
                packetSpecificDatabuf.writeUInt16BE(this.packet_specific_data.data);
            }
        }

        let ready = Buffer.from(Buffer.concat([headerBuf, packetSpecificDatabuf, this.payload, Buffer.from([this.checksum])]))
        return ready;

    }


}

// export type PacketLocation = "client" | "server" | string;
export enum PacketLocation {
    Client = 0x3f,
    Server = 0x31,
    ClientAfterHandshake = 0x3e
}

export function toTypeAndFlag(type: PacketType, flags: PacketFlag[]): number {
    let typeAndFlag = 0;
    switch (type) {
        case "syn":
            typeAndFlag = 0x0;
            break;
        case "connect":
            typeAndFlag = 0x1;
            break;
        case "data":
            typeAndFlag = 0x2;
            break;
        case "disconnect":
            typeAndFlag = 0x3;
            break;
        case "ping":
            typeAndFlag = 0x4;
            break;
        case "user":
            typeAndFlag = 0x5;
            break;
        default:
            throw new Error("Invalid packet type");
    }

    let flag = 0;
    for (const f of flags) {
        switch (f) {
            case "ack":
                flag |= 0x1;
                break;
            case "reliable":
                flag |= 0x2;
                break;
            case "need-ack":
                flag |= 0x4;
                break;
            case "has-size":
                flag |= 0x8;
                break;
            default:
                throw new Error("Invalid packet flag");
        }
    }
    return (flag << 3) | typeAndFlag;
}

export type PacketFlag = "ack" | "reliable" | "need-ack" | "has-size";
function getPacketFlags(typeAndFlag: number): PacketFlag[] {
    const flag = typeAndFlag >> 3;
    const flags: PacketFlag[] = [];
    if (flag & 0x1) {
        flags.push("ack");
    }
    if (flag & 0x2) {
        flags.push("reliable");
    }
    if (flag & 0x4) {
        flags.push("need-ack");
    }
    if (flag & 0x8) {
        flags.push("has-size");
    }
    return flags;
}

export type PacketType = "syn" | "connect" | "data" | "disconnect" | "ping" | "user"
function getPacketType(typeAndFlag: number): PacketType {
    const type = typeAndFlag & 0x7;
    switch (type) {
        case 0x0:
            return "syn";
        case 0x1:
            return "connect";
        case 0x2:
            return "data";
        case 0x3:
            return "disconnect";
        case 0x4:
            return "ping";
        case 0x5:
            return "user";
        default:
            throw new Error("Invalid packet type");
    }

}





export interface IPacketSpecificData {
    type: "connection-signature" | "fragment-id" | "payload-size"
    data: any
}