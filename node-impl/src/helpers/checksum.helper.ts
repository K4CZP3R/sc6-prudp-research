import struct from "python-struct"


export function checkChecksum(data: Buffer, accessKey: string): boolean {
    try {
        let words = struct.unpack(`<${data.length / 4}I`, this.data)
        let temp = (sum(words) & 0xFFFFFFFF) >>> 0;

        let checksum = sum(Buffer.from(accessKey));
        checksum += sum(data.slice(data.length & ~3));
        checksum += sum(struct.pack("I", temp));
        return (checksum & 0xFF) === this.checksum;
    } catch (e: unknown) { return false; }
}

export function checkQuazalChecksum(data: Buffer, accessKey: string) {
    let data_with_padding = Buffer.alloc(data.length + (4 - (data.length % 4)), 0x00);
    let words = struct.unpack(`<${data.length / 4}I`, data_with_padding);
    return (((sum(Buffer.from(accessKey)) & 0xFF) + sum(words)) & 0xFFFFFFFF) >>> 0;
}

function sum(arr: any) {
    var result = 0, n = arr.length || 0; //may use >>> 0 to ensure length is Uint32
    while (n--) {
        result += +arr[n]; // unary operator to ensure ToNumber conversion
    }
    return result;
}