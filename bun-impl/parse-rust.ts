import { readFile, writeFile } from "fs/promises";

const f = await readFile("./rust.txt");

const all = f.toString();

const regex = /PACKET(?: SEND)?: \[([^\]]+)\]/g;

// find multiple matches, regex.exec only returns one match, so use regex.exec in a loop
const matches = [];
let match;
while ((match = regex.exec(all)) !== null) {
  // Raw are string of hex values, split by comma and space
  const raw = match[1].split(", ");
  // Convert each hex value to a number
  const numbers = raw.map((v) => parseInt(v, 16));
  const buffer = Buffer.from(numbers);
  // Convert back to hex
  matches.push(buffer.toString("hex"));
}

writeFile("rust.json", JSON.stringify(matches, null, 2));
