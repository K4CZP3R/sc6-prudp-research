// import { AuthenticationServer } from "./src/authentication.server";

import { AuthenticationServer } from "./src/authentication.server";
import { Adbuf } from "./src/helpers/adbuf";
import { QPacket } from "./src/models/qpacket.model";
import PACKETS from "../unique-payloads/filtered_payloads_5_49.json";

async function main() {
  const authServer = new AuthenticationServer();
  // await authServer.initialize();
  const PACKETS = ["3f3120000000000000000000000040"];
  for (const packet of PACKETS) {
    const b = Buffer.from(packet, "hex");
    const [qpacket, offset] = QPacket.fromBytes(new Adbuf(b));

    const packetData = b.subarray(0, offset - 1);

    qpacket.validate(new Adbuf(packetData));
    authServer.handlePacket(qpacket);
  }
}

main().catch(console.error);
