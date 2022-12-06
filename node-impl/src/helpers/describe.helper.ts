import { Packet } from '../packet.js';
export function packetDescribe(packet: Packet) {

    let payloadHex = packet.payload.toString("hex");
    let checksumHex = packet.checksum.toString(16);

    let specificData = "";

    switch (packet.packet_specific_data?.type) {
        case undefined:
            specificData = "undefined";
            break;
        case "connection-signature":
        case "fragment-id":
            specificData = `${packet.packet_specific_data.type} is ${packet.packet_specific_data.data.toString(16)}`
            break;
    }
    return `${packet.source} [s:${packet.session_id}|seq:${packet.sequence_id}] (${packet.type} <${packet.flags}>) {${packet.source}->${packet.destination}} payload=${payloadHex} checksum=${checksumHex} ((specific=${specificData}))`;
}