export type Byte = number & { __byte__: never };

export function byte(val: number): Byte {
  return new Int8Array([val]).at(0) as Byte;
}
