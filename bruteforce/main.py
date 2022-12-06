import struct
import json
import time
import sys


def calc_checksum(data, access_key):
    words = struct.unpack_from("<%iI" % (len(data) // 4), data)
    temp = sum(words) & 0xFFFFFFFF  # 32-bit

    checksum = sum(access_key)
    checksum += sum(data[len(data) & ~3 :])
    checksum += sum(struct.pack("I", temp))
    return checksum & 0xFF  # 8-bit checksum


payloads_raw = json.load(open("../payloads.json", "r"))


# Get core to run on
core_id = int(sys.argv[1])


# Split 4294967295 keys to 6 cores
range_from = 0 + (0xFFFFFFFF - 0) / 6 * core_id
# Floor
range_from = int(range_from)
range_to = range_from + (0xFFFFFFFF - 0) / 6
# Ceil
range_to = int(range_to) + 1

print(range_from, range_to)
payloads = []
for payload in payloads_raw:
    # hex string to bytes
    payloads.append(bytes.fromhex(payload))

for access_key_int in range(range_from, range_to):
    access_key_bytes = struct.pack("<I", access_key_int)
    access_key = access_key_bytes.hex().upper()

    key_valid_in_every_payload = True

    if access_key_int % 1000 == 0:
        start_calc = time.time()

    for payload in payloads:

        data = payload[:-1]
        checksum = payload[-1:]

        # convert checksum to int, without unpack because of length
        checksum = int.from_bytes(checksum, byteorder="big")

        calculated = calc_checksum(data, access_key_bytes)
        if calculated != checksum:
            key_valid_in_every_payload = False
            continue

    if key_valid_in_every_payload:
        print("Access key: %s" % access_key)
        break

    # Report every 1000th key
    if access_key_int % 10000 == 0:
        end_calc = time.time()
        one_calculation_took = end_calc - start_calc
        calculations_left = range_to - access_key_int
        time_left = calculations_left * one_calculation_took
        print("Access key: %s, time left: %sh" % (access_key, time_left // 60 // 60))
