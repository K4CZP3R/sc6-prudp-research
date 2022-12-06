import json
import sys


payloads = json.load(open("payloads.json"))


def get_type(payload: str):
    # convert hex str to bytes
    payload = bytes.fromhex(payload)
    # Type and flags are at 0x2 offset and take 1 byte
    # byte = (flags << 3) | type

    # get the byte
    byte = payload[0x2]
    # get the type
    type = byte & 0x7

    return type


def get_destination(payload: str):
    # convert hex str to bytes
    payload = bytes.fromhex(payload)
    # Destination is at 0x3 offset and takes 1 byte
    destination = payload[0x1]

    return destination


packet_type = int(sys.argv[1])
direction = 49 if sys.argv[2] == "to-server" else 63

# 49 and 63

filtered_payloads = []

for payload in payloads:
    if get_type(payload) == packet_type and get_destination(payload) == direction:
        filtered_payloads.append(payload)

# Filter out duplicates
filtered_payloads = list(set(filtered_payloads))

json.dump(
    filtered_payloads,
    open(f"unique-payloads/filtered_payloads_{packet_type}_{direction}.json", "w"),
    indent=4,
)
