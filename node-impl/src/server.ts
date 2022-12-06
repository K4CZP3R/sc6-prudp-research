import { packetDescribe } from "./helpers/describe.helper.js";
import { getConnectionSignature } from "./helpers/packet.helper.js";
import { fromPacketLocation, Packet, toTypeAndFlag } from "./packet.js";

export class Server {
    private clientState: {
        [clientId: number]: {
            serverConnectionSignature: number,
            clientConnectionSignature?: number
        }
    } = {
        }
    constructor() { }

    private handleConnectPacket(packet: Packet, dummyClientId: number) {
        if (!this.clientState[dummyClientId]) {
            console.warn("Ignoring packet, client state does not exist!");
            return;
        }

        let clientConnectionSignature = getConnectionSignature(packet);
        this.clientState[dummyClientId].clientConnectionSignature = clientConnectionSignature;





    }

    private handleSynPacket(packet: Packet, dummyClientId: number) {
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

        console.log(packetDescribe(newPacket))

        this.clientState[dummyClientId] = {
            serverConnectionSignature
        }

    }

    handlePacket(packet: Packet, dummyClientId: number) {
        if (packet.destination !== "server") throw new Error("Packet destination is not server!");

        console.log("Received", packet.type, "from", dummyClientId)
        switch (packet.type) {
            case "syn":
                this.handleSynPacket(packet, dummyClientId);
                break;
            case "connect":
                this.handleConnectPacket(packet, dummyClientId);
                break;

        }
    }
}