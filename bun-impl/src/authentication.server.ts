import debug from "debug";

import type { BinaryTypeList, Socket, udp } from "bun";
import { QPacket } from "./models/qpacket.model";
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

import chalk from "chalk";

const log = debug("authentication");

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

  constructor(private onSendPacket: (packet: QPacket) => void) {}

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

    log("Server is running on port", CONFIG.listen.port);
  }

  private async onData(
    socket: udp.Socket<"buffer">,
    data: BinaryTypeList["buffer"],
    port: number,
    address: string
  ) {
    log("onData", socket, data, port, address);
  }

  handlePacket(packet: QPacket) {
    log("Handling packet", packet.toString());
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
    const ci = this.clientRegistry.clients.get(packet.signature);
    if (!ci) {
      throw new Error("client is unknown");
    }

    ci.lastSeen = new Date();
    this.sendAck(packet, ci, false);

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
      const rmcPacket = getPacket(new Adbuf(payload));

      if (rmcPacket instanceof Response) {
        throw new Error("RMC response not supported here. Unimplemented.");
      }

      if (rmcPacket.protocolId === 10) {
        if (rmcPacket.methodId === TicketGrantingProtocolMethod.LoginEx) {
          const loginRequest = LoginExRequest.fromBuffer(rmcPacket.parameters);

          log("Login requested from", loginRequest.user, loginRequest.username);

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

          const resp = new LoginExResponse(
            0,
            ci.userId!,
            ticketBuf,
            this.getConnectionData(4096),
            ""
          );

          const responsePacket = new Adbuf(Buffer.alloc(0));
          if (rmcPacket.protocolId < 0x7f) {
            responsePacket.addU8(rmcPacket.protocolId);
          } else {
            responsePacket.addU8(0x7f);
            responsePacket.addU16(rmcPacket.protocolId);
          }

          // TODO: Add error handling
          responsePacket.addU8(0x1);
          responsePacket.addU32(rmcPacket.callId);
          responsePacket.addU32(rmcPacket.methodId | 0x8000);
          responsePacket.add(resp.toBuffer());
          responsePacket.addU32(resp.toBuffer().length);

          console.log(responsePacket.realBuffer.toString("hex"));
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
    const ci = new ClientInfo(1954425400);
    const sig = ci.serverSignature;

    this.newClients[sig] = ci;
    packet.connSignatue = sig;

    this.sendAck(packet, ci, false);
  }

  private handleConnect(packet: QPacket) {
    if (!packet.connSignatue) {
      console.error("deny connect. no signature.");
      return;
    }

    if (!this.newClients[packet.signature]) {
      console.warn("deny connect. unknown signature");
      return;
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

      log("???");

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

    this.sendPacket(resp);
  }

  private sendPacket(packet: QPacket) {
    if (packet.packetType === PacketType.Data) {
      packet.useCompression = false; // TODO: it supposed to be true but maybe we can send uncompressed data??
      if (!packet.fragmentId) {
        packet.fragmentId = 0;
      }
    }
    packet.flags.add(PacketFlag.HasSize);

    this.onSendPacket(packet);
  }
}
