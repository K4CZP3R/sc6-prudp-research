from enum import Enum


class PacketLocation(Enum):
    SERVER = 0x31
    CLIENT = 0x3F


class PacketType(Enum):
    SYN = 0x00
    CONNECT = 0x01
    DATA = 0x02
    DISCONNECT = 0x03
    PING = 0x04
    USER = 0x05


class Packet:
    def __init__(self, raw_bytes: bytes) -> None:
        # Self source is PacketLocation enum
        print(raw_bytes.hex())
        self.source = raw_bytes[0]
        self.destination = raw_bytes[1]
        self.type_and_flags = raw_bytes[2]
        self.session_id = raw_bytes[3]
        self.packet_signature = raw_bytes[4 : 4 + 4]
        self.sequence_id = raw_bytes[8 : 8 + 2]
        p_type = self.get_type()
        if p_type == PacketType.SYN or p_type == PacketType.CONNECT:
            self.packet_specific_data = raw_bytes[10 : 10 + 4]
            # Payload starts at 14 and ends at the end of the packet - 1
            self.payload = raw_bytes[14 : len(raw_bytes) - 2]
        elif p_type == PacketType.DATA:
            self.packet_specific_data = raw_bytes[10 : 10 + 1]
            # Payload starts at 11 and ends at the end of the packet - 1
            self.payload = raw_bytes[11 : len(raw_bytes) - 2]
        elif self.has_flag_has_size():
            self.packet_specific_data = raw_bytes[10 : 10 + 2]
            self.payload = raw_bytes[12 : len(raw_bytes) - 2]
        else:
            # Payload is the rest of the packet - checksum byte at the end
            self.payload = raw_bytes[10 : len(raw_bytes) - 2]
            self.packet_specific_data = None
        self.checksum = raw_bytes[len(raw_bytes) - 1]

    def get_type(self) -> PacketType:
        return self.type_and_flags & 0x7

    def has_flag_has_size(self) -> bool:
        # (flags << 3) | type
        flags = self.type_and_flags >> 3
        return flags & 0x008
