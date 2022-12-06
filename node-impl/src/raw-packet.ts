export interface IPacketHeader {
    source: number;
    destination: number;
    type_and_flags: number;
    session_id: number;
    packet_signature: number;
    sequence_id: number;
}


export function headerFromBuffer(buf: Buffer): IPacketHeader {
    return {
        source: buf[0x0],
        destination: buf[0x1],
        type_and_flags: buf[0x2],
        session_id: buf[0x3],
        packet_signature: buf.readUInt32BE(0x4),
        sequence_id: buf.readUInt16BE(0x8)
    }
}
