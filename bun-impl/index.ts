import debug from "debug";
import { AuthenticationServer } from "./src/authentication.server";
import { Adbuf } from "./src/helpers/adbuf";
import { QPacket } from "./src/models/qpacket.model";
import PACKETS from "./rust.json";
import { PacketType } from "./src/models/packet-type.enum";

const log = debug("index");

const TO_RECEIVE_PACKETS = PACKETS.filter((p) => p.startsWith("313f"));

const TO_SEND_PACKETS = PACKETS.filter((p) => p.startsWith("3f31")).slice(0, 3);

async function main() {
  const authServer = new AuthenticationServer((sentPacket) => {
    log("Server sent", sentPacket.toString());

    const expected = TO_RECEIVE_PACKETS.shift();
    const sent = sentPacket.toBuffer().toString();
    if (expected !== sent) {
      throw new Error(
        `Packet mismatch:\n${expected} <- Expected\n${sent} <- Sent`
      );
    } else {
      log(
        `Server sent valid response.\n${expected} <- Expected\n${sent} <- Sent`
      );
    }
  });
  // await authServer.initialize();
  const PACKETS = TO_SEND_PACKETS.map(
    (packet) => new Adbuf(Buffer.from(packet, "hex"))
  );
  for (const packet of PACKETS) {
    log("Sending", packet.toString());
    const [qpacket, offset] = QPacket.fromBytes(packet);
    const packetData = packet.subarray(0, offset - 1);
    qpacket.validate(new Adbuf(packetData));
    authServer.handlePacket(qpacket);
  }
}

main().catch(console.error);

const x = QPacket.fromBytes(
  new Adbuf(
    Buffer.from(
      "313f72060100b27f010000f8000effd8daffff3fafeda261fd2017f8b1ff56e4759756a31c5bef5f048ada2c0e767c375b7face54f5fd26d2e78f6f48f4f83839ef977b70b080ebf6c193837d0afc3ae4925d71fee8288e4d8a1522186720bd00b2d3c4d8377c8037cc13ec470324f68f477e1408f029629184992398ee3d4b7ab8c2d1718179e4b4698be80beb06e05f3250ec17daacb72d2500b03caf8a72d2f08d06a13c8e5ece0f57ad8195a8652b771450722e917767456dc82b4473cd9a80f5d08ca3499f683543680d45862860d2394ab467f80e2378b2d05a79ea6676a569ffe360eccaa3f5c9188349cb9bf6b6152dd39acfe868c0f47f1ef01d3ae7d494d20e94a",
      "hex"
    )
  )
);

console.log("expected", x.toString());
