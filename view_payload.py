from models.packet import Packet, PacketLocation


payloads = [
    "313f4800000000000000a48af75e0000ec",
    "313f4800000000000000cd77dbef000079",
    "313f4800000000000000cd77d3fe000080",
    "313f4800000000000000e4fabe5d000062",
    "313f48000000000000006c05dfbe000077",
    "313f4800000000000000e491ed2d0000f9",
    "313f48000000000000001e1d635d000063",
]

for payload in payloads:

    # Convert the hex string to bytes
    raw_bytes = bytes.fromhex(payload)

    # Create a packet object
    packet = Packet(raw_bytes)

    # Print the packet's payload
    # convert bytes to hex string
    print(
        "pcd random signature:",
        packet.packet_specific_data.hex(),
        "payload",
        packet.payload.hex(),
        "checksum",
        packet.checksum,
    )
