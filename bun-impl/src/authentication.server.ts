import type { BinaryTypeList, Socket, udp } from "bun";
import type { QPacket } from "./models/qpacket.model";
import { PacketFlag } from "./models/bit-flags.model";
import { PacketType } from "./models/packet-type.enum";
import { ClientInfo } from "./models/client-info.model";
import { Adbuf } from "./helpers/adbuf";

const CONFIG = {
  type: "authentication",
  accessKey: "yl4NG7qZ",
  cryptoKey: "CD&ML",
  listen: {
    host: "0.0.0.0",
    port: 21170,
  },
  vport: 1,
  secureServerAddr: "127.0.0.1:21171",
  ticketKey: [
    49, 233, 180, 74, 12, 122, 27, 58, 25, 105, 121, 4, 85, 252, 29, 233, 140,
    119, 187, 129, 187, 100, 210, 64, 155, 87, 181, 113, 49, 65, 251, 50,
  ],
};

export class AuthenticationServer {
  private clients: { [signature: number]: ClientInfo } = {};
  private server?: udp.Socket<"buffer">;
  async initialize() {
    this.server = await Bun.udpSocket({
      socket: {
        data: (socket, data, port, address) => {
          this.onData(socket, data, port, address);
        },
      },
      port: CONFIG.listen.port,
      hostname: CONFIG.listen.host,
    });

    console.log("Server is running on port", CONFIG.listen.port);
  }

  private async onData(
    socket: udp.Socket<"buffer">,
    data: BinaryTypeList["buffer"],
    port: number,
    address: string
  ) {
    console.log("onData", socket, data, port, address);
  }

  handlePacket(packet: QPacket) {
    // console.log(">>> ", packet.sourceBuf.realBuffer.toString("hex"));
    if (packet.flags.includes(PacketFlag.Ack)) {
      return;
    }

    switch (packet.packetType) {
      case PacketType.Syn:
        this.handleSyn(packet);
        break;
      case PacketType.Connect:
        this.handleConnect(packet);
        break;
      default:
        console.warn("unknown packet type", packet.packetType);
    }
  }

  private handleSyn(packet: QPacket) {
    console.log("Syn packet!");
    const ci = new ClientInfo();
    const sig = ci.serverSignature;

    this.clients[sig] = ci;
    packet.connSignatue = sig;

    console.log(sig, packet.connSignatue);

    this.sendAck(packet, ci, false);
  }

  private handleConnect(packet: QPacket) {
    console.log("handleConnect");
    if (!packet.connSignatue) {
      console.error("deny connect. no signature.");
      return;
    }

    if (!this.clients[packet.signature]) {
      console.warn("deny connect. unknown signature");
      // return;
    }
  }

  private sendAck(packet: QPacket, ci: ClientInfo, keepPayload: boolean) {
    const resp = packet.clone();

    resp.source = packet.destination;
    resp.destination = packet.source;
    resp.flags.set([PacketFlag.Ack, PacketFlag.HasSize]);
    resp.signature = ci.clientSignature ?? 0;
    resp.sessionId = ci.serverSession;
    resp.connSignatue = packet.connSignatue;
    if (!keepPayload) {
      resp.payload = Buffer.from([]);
    }
    resp.sequence = packet.sequence;

    console.log(resp.toJSON());
    this.sendPacket(resp);
  }

  private sendPacket(packet: QPacket) {
    if (packet.packetType === PacketType.Data) {
      packet.useCompression = true;
      if (!packet.fragmentId) {
        packet.fragmentId = 0;
      }
    }
    packet.flags.add(PacketFlag.HasSize);

    const data = packet.toBuffer();
    // Send it
    console.log("Will send", data.realBuffer.toString("hex"));
  }
}
