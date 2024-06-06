// import { AuthenticationServer } from "./src/authentication.server";

import { AuthenticationServer } from "./src/authentication.server";
import { Adbuf } from "./src/helpers/adbuf";
import { QPacket } from "./src/models/qpacket.model";
import PACKETS from "../payloads.json";
import { PacketType } from "./src/models/packet-type.enum";

async function main() {
  const authServer = new AuthenticationServer();
  // await authServer.initialize();
  const PACKETS = [
    "3f3120000000000000000000000040",
    "3f313111382a7e7401000100b27fe9",
    "3f313211382a7e740200000dffd870759f4cb8e7a073b16ada3de163cefdaa05c7b883ccb62996d01ee0c666e651ed8b910f6cbf26e7ab109c5768f17ddedb77bab2ec3c7e2deed755a559fbba35686dfbf34ea42634f00fd397043ef119752d01ef716dc29fae214969fecdadee264f50542fab8ebd0a14e65b8ab44f",
  ];
  for (const packet of PACKETS) {
    const b = Buffer.from(packet, "hex");
    const [qpacket, offset] = QPacket.fromBytes(new Adbuf(b));
    const packetData = b.subarray(0, offset - 1);
    qpacket.validate(new Adbuf(packetData));

    authServer.handlePacket(qpacket);
    // console.log(qpacket);
  }
}

main().catch(console.error);
