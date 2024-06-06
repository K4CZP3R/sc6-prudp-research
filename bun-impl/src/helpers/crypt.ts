export function cryptKey(key: Buffer, data: Buffer): Buffer {
  const rc4 = new Rc4(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ rc4.next();
  }
  return Buffer.from(result);
}

class Rc4 {
  private i: number = 0;
  private j: number = 0;
  private state: Uint8Array = new Uint8Array(256);

  constructor(key: Uint8Array) {
    if (key.length === 0 || key.length > 256) {
      throw new Error("Key length must be between 1 and 256 bytes.");
    }

    for (let i = 0; i < 256; i++) {
      this.state[i] = i;
    }

    let j: number = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.state[i] + key[i % key.length]) % 256;
      [this.state[i], this.state[j]] = [this.state[j], this.state[i]];
    }
  }

  next(): number {
    this.i = (this.i + 1) % 256;
    this.j = (this.j + this.state[this.i]) % 256;
    [this.state[this.i], this.state[this.j]] = [
      this.state[this.j],
      this.state[this.i],
    ];
    const k = (this.state[this.i] + this.state[this.j]) % 256;
    return this.state[k];
  }
}
