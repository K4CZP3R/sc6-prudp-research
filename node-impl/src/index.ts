import { packetDescribe } from './helpers/describe.helper.js';
import { packetsAreEqual } from './helpers/packet.helper.js';
import { Packet } from './packet.js';
import { headerFromBuffer } from './raw-packet.js';
import { Server } from './server.js';
import fs from "fs"

// let lines = [
//     "3f3120000000000000000000000040",
//     "313f4800000000000000e4fabe5d000062",
//     "3f313194e4fabe5d0100ae37f2da93",
//     "313f49ecae37f2da01000000000001000f18",
//     "3f313294e4fabe5d0200000dffd8f0729f4cb8e7a073b16ada33e16f0f8497fd3460bc92ff2f9363821a9ce7e692964a0743370d704c76a3cb02405eeecd8624220e99807f829e4a196a9f023a1e73821d7317a63abefe71248e86d4621989aaed8a64679ce1ae81e5f9f94d3865a558d823d75c92f483155bdc75d5a26c",
//     "313f4aecae37f2da02000000000a",
//     "313f72ecae37f2da010000bc000dffd800da3fec90c06a64d9b30ceaa9e7d7361d3e762113ca10c5d9633e2caf6173b3a98771f269239c53035b92e64d664e24acf98c7fd647e41923a1821e63724628d304b8bb17c83c00e738986f9042cb081d9210de70aa347142f10ff3ec0b2941441e84eeb10ad50e48550a57e38b0c613defbbc4617b3d8f525d13861ecd1774d01cc51d045c5014a3fd22190258099491a17095ea79bb88da8a50bc43cdb4bc5c642e9e85619ac0cd013dba2fc04be2b9f416078e19fcf26d75"
// ]

let lines = fs.readFileSync("C:\\Users\\kacpe\\Documents\\dev\\sc6-prudp-research\\node-impl\\shaggy_18_prudp_only.txt").toString().split("\n");


const packets = lines.map(line => {
    let buf = Buffer.from(line, "hex")
    return Packet.fromHeaderAndBuffer(headerFromBuffer(buf), buf)
});

console.log("Available packets:")
packets.forEach(packet => {
    console.log(packetDescribe(packet))
})
console.log("--------")
const serv = new Server();

let serverPacket = serv.handlePacket(packets[0], 0);
let perfectPacket = packets[1];

if (!packetsAreEqual(serverPacket, perfectPacket)) {
    throw new Error("Our server packet is not equal to the perfect packet!");
}

serverPacket = serv.handlePacket(packets[2], 0)
perfectPacket = packets[3];

if (!packetsAreEqual(serverPacket, perfectPacket)) {
    console.log(serverPacket.toBuffer().toString("hex"), packetDescribe(serverPacket))
    console.log(perfectPacket.toBuffer().toString("hex"), packetDescribe(perfectPacket))
    throw new Error("Our server packet is not equal to the perfect packet!");
}
