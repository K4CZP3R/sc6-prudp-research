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

print("Got {} payloads".format(len(payloads)))

json.dump(payloads, open("payloads.json", "w"))
