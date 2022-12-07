import { runInThisContext } from "vm";
import { packetDescribe } from "./helpers/describe.helper.js";
import { getConnectionSignature } from "./helpers/packet.helper.js";
import { Packet, PacketLocation } from "./packet.js";

export class Server {
    private clientState: {
        [clientId: number]: {
            serverConnectionSignature: number,
            clientConnectionSignature?: number,
            serverSessionId?: number;
            clientSessionId?: number;
            currentSequenceId: number;
        }
    } = {
        }
    constructor() { }

    private handleConnectPacket(packet: Packet, dummyClientId: number): Packet {
        if (!this.clientState[dummyClientId]) {
            console.warn("Ignoring packet, client state does not exist!");
            return;
        }

        let clientConnectionSignature = getConnectionSignature(packet);
        this.clientState[dummyClientId].clientConnectionSignature = clientConnectionSignature;
        this.clientState[dummyClientId].clientSessionId = packet.session_id;

        const serverSessionId = 236;
        this.clientState[dummyClientId].serverSessionId = serverSessionId;

        // Advance sequence id
        this.clientState[dummyClientId].currentSequenceId = packet.sequence_id;

        let newPacket = new Packet(
            packet.destination,
            packet.source,
            "connect",
            ["ack", "has-size"],
            serverSessionId,
            this.clientState[dummyClientId].clientConnectionSignature,
            this.clientState[dummyClientId].currentSequenceId,
            {
                type: "connection-signature",
                data: 0
            },
            Buffer.from([0x01, 0x00, 0x0f]),
            0x18
        )

        return newPacket
    }

    private handleSynPacket(packet: Packet, dummyClientId: number): Packet {
        // Client wants to talk with us!

        // Check if we have a state for this client
        if (this.clientState[dummyClientId]) {
            console.warn("Client state already exists!");
            return;
        }


        // Lets hardcode our connection signature for now
        const serverConnectionSignature = 0xe4fabe5d;


        let newPacket = new Packet(
            packet.destination,
            packet.source,
            "syn",
            ["ack", "has-size"],
            0,
            0,
            0,
            {
                type: "connection-signature",
                data: serverConnectionSignature
            },
            Buffer.alloc(2),
            0x62
        )



        this.clientState[dummyClientId] = {
            serverConnectionSignature, currentSequenceId: 0
        }

        return newPacket;

    }

    handlePacket(packet: Packet, dummyClientId: number): Packet {
        if (packet.destination !== PacketLocation.Server) throw new Error("Packet destination is not server!");

        console.log("Received", packet.type, "from", dummyClientId)

        let packetToSend: Packet | undefined;
        switch (packet.type) {
            case "syn":
                packetToSend = this.handleSynPacket(packet, dummyClientId);
                break;
            case "connect":
                packetToSend = this.handleConnectPacket(packet, dummyClientId);
                break;
        }

        if (packetToSend)
            console.log("Will send", packetToSend?.type, "to", dummyClientId, packetDescribe(packetToSend));
        return packetToSend;
    }
}