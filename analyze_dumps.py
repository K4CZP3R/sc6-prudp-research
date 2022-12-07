# Get all the dumps from the directory and analyze them

import os
import json

payloads = []


def analyze_dumps(dump_dir):
    """
    Analyze all the dumps in the directory
    """
    dump_files = os.listdir(dump_dir)
    for dump_file in dump_files:
        if dump_file.endswith(".json"):
            dump_file_path = os.path.join(dump_dir, dump_file)
            with open(dump_file_path, "r") as dump_file:
                packets = json.load(dump_file)
                for packet in packets:
                    val = None
                    if "udp.payload_raw" not in packet["_source"]["layers"]["udp"]:
                        val = packet["_source"]["layers"]["udp"]["udp.payload"].replace(
                            ":", ""
                        )
                    else:
                        val = packet["_source"]["layers"]["udp"]["udp.payload_raw"][0]

                    if val is not None:
                        payloads.append(val)


analyze_dumps("wireshark-dumps")

# Filter out payloads which do not start with 31 or 3f
payloads = [
    payload
    for payload in payloads
    if payload.startswith("313f") or payload.startswith("3f31")
]

# Remove duplicates
payloads = list(set(payloads))
print("Got {} payloads".format(len(payloads)))

json.dump(payloads, open("payloads.json", "w"))
