import type { BinaryTypeList, Socket, udp } from "bun";
import type { QPacket } from "./models/qpacket.model";
import { PacketFlag } from "./models/bit-flags.model";
import { PacketType } from "./models/packet-type.enum";
import { ClientInfo } from "./models/client-info.model";
import { Adbuf } from "./helpers/adbuf";
import { ClientRegistry } from "./models/client-registry.model";
import { StreamType } from "./models/stream-type.enum";
import { Response, getPacket } from "./models/rmc-packet.model";
import { TicketGrantingProtocolMethod } from "./models/ticket-granting-protocol-method.model";

import { KerberosTicket } from "./models/kerberos-ticket.model";
import { KerberosTicketInternal } from "./models/kerberos-ticket-internal.model";
import { LoginExRequest } from "./models/loginex-request.model";
import { LoginExResponse } from "./models/loginex-response.model";
import { RVConnectionData } from "./models/rv-connection-data.model";

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
    198, 226, 29, 218, 118, 124, 253, 219, 188, 169, 211, 0, 121, 181, 44, 221,
    223, 85, 144, 82, 64, 40, 122, 181, 11, 125, 106, 32, 56, 99, 96, 29,
  ],
};

export class AuthenticationServer {
  private newClients: { [signature: number]: ClientInfo } = {};
  private clientRegistry = new ClientRegistry();
  private server?: udp.Socket<"buffer">;
  private nextConnId: number = 0x3aaa_aaaa;
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
      case PacketType.Data:
        this.handleData(packet);
        break;
      default:
        console.warn("unknown packet type", PacketType[packet.packetType]);
    }
  }

  private async handleData(packet: QPacket) {
    console.log("data packet!");

    const ci = this.clientRegistry.clients.get(packet.signature);
    if (!ci) {
      throw new Error("client is unknown");
    }

    ci.lastSeen = new Date();
    // this.sendAck(packet, ci, false); does not work yet.

    let payload: any = null;
    if (packet.fragmentId !== undefined) {
      if (packet.fragmentId !== 0) {
        throw new Error("Not implemented");
      }

      // TODO: ci.packet_fragments_is_empty

      payload = packet.payload!;
    } else {
      payload = packet.payload!;
    }

    if (
      packet.destination.streamType === StreamType.RVSec &&
      packet.destination.port === 1
    ) {
      console.log("RVSecHandler");

      const rmcPacket = getPacket(new Adbuf(payload));

      if (rmcPacket instanceof Response) {
        throw new Error("RMC response not supported here. Unimplemented.");
      }

      console.log(
        "Looking for protocol",
        rmcPacket.protocolId,
        "and method",
        rmcPacket.methodId
      );
      if (rmcPacket.protocolId === 10) {
        console.log("TicketGrantingProtocol");

        if (rmcPacket.methodId === TicketGrantingProtocolMethod.LoginEx) {
          const loginRequest = LoginExRequest.fromBuffer(rmcPacket.parameters);

          console.log(
            "Login requested from",
            loginRequest.user,
            loginRequest.username
          );

          // Do login logic here.

          ci.userId = 69;
          let sessionKey = Buffer.from([
            6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
          ]);
          let ticket = new KerberosTicket(
            sessionKey,
            4096,
            new KerberosTicketInternal(ci.userId!, 1844674407370955, sessionKey)
          );

          const ticketBuf = await ticket.toBuffer(
            ci.userId!,
            Buffer.from(CONFIG.ticketKey)
          );

          new LoginExResponse(
            0,
            ci.userId!,
            ticketBuf,
            this.getConnectionData(4096),
            ""
          );
        } else {
          throw new Error("Unknown method id");
        }
      } else {
        throw new Error("Unknown protocol id");
      }
    }
  }

  private getConnectionData(serverPid: number) {
    return new RVConnectionData(
      `prudp:/address={};port={};CID=1;PID=${serverPid},sid=2;steam=3;type=2`,
      Buffer.from([]),
      `prudp:/address={};port={};CID=1;PID=${serverPid},sid=2;steam=3;type=2`
    );
  }

  private handleSyn(packet: QPacket) {
    console.log("Syn packet!");
    const ci = new ClientInfo(1954425400);
    const sig = ci.serverSignature;

    this.newClients[sig] = ci;
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
    console.log("Signature", packet.signature);

    if (!this.newClients[packet.signature]) {
      console.warn("deny connect. unknown signature");
    }

    let ci = this.newClients[packet.signature];
    // Remove client from newClients
    delete this.newClients[packet.signature];

    ci.clientSignature = packet.connSignatue!;
    ci.serverSession = 6;
    ci.clientSession = packet.sessionId;

    this.clientRegistry.clients.set(packet.signature, ci);

    if (packet.payloadSize !== 0) {
      const ticketKey = CONFIG.ticketKey;

      // const x = new ReadStream(new Adbuf(packet.payload!));

      // const ticket = x.readU8Buffer();
      // const requestData = x.readU8Buffer();
      // console.log(ticket, requestData);
      // Read Vec<u8>
    }

    packet.connSignatue = 0;

    this.sendAck(packet, ci, packet.payloadSize != 0);
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
