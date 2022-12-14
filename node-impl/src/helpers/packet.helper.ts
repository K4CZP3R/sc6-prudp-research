import { pack } from "python-struct";
import { Packet, PacketLocation } from "../packet.js";

export function conFromClient(packet: Packet) {
    // Connect from client should contain their connection signature

    if (packet.type !== "connect") throw new Error("Packet type is not SYN!");
    if (packet.source !== PacketLocation.Client) throw new Error("Packet source is not client!");
    if (packet.destination !== PacketLocation.Server) throw new Error("Packet destination is not server!");
    if (packet.packet_specific_data?.type !== "connection-signature") throw new Error("Packet specific data is not connection signature!");
    if (!packet.flags.includes("reliable") || !packet.flags.includes("need-ack")) throw new Error("Con from client has invalid flags!");
    return packet.packet_specific_data.data;
}


export function getConnectionSignature(packet: Packet): number {
    if (packet.type === "connect" && packet.source === PacketLocation.Client) return conFromClient(packet);
    else {
        throw new Error("Packet not supported!");
    }
}

export function packetsAreEqual(packet: Packet, packet2: Packet) {
    return packet.toBuffer().equals(packet2.toBuffer());
}