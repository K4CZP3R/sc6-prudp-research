export function hexdump(data: Buffer, bytesPerLine = 16): string {
  const result: string[] = [];

  for (let i = 0; i < data.length; i += bytesPerLine) {
    const chunk = data.slice(i, i + bytesPerLine);

    const address = i.toString(16).padStart(8, "0");

    const hex = Array.from(chunk, (byte) => byte.toString(16).padStart(2, "0"))
      .join(" ")
      .padEnd(bytesPerLine * 2 + (bytesPerLine - 1));

    const ascii = Array.from(chunk, (byte) => {
      return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
    })
      .join("")
      .padEnd(bytesPerLine);

    result.push(`${address}: ${hex} |${ascii}|`);
  }

  return result.join("\n");
}
