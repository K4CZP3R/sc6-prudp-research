import { colored } from "../helpers/colors";

export enum PacketFlag {
  Ack = 1,
  Reliable = 2,
  NeedAck = 4,
  HasSize = 8,
}

export class PacketFlags {
  private flags: PacketFlag[] = [];

  toString() {
    return colored(this, {
      exlucdeProps: ["flags"],
      customProps: [
        { key: "flags", value: this.flags.map((f) => PacketFlag[f]).join("|") },
      ],
    });
  }

  toJSON() {
    return this.flags.map((flag) => PacketFlag[flag]);
  }

  includes(flag: PacketFlag) {
    return this.flags.includes(flag);
  }

  set(flags: PacketFlag[]) {
    this.flags = flags;
  }

  add(flag: PacketFlag) {
    if (!this.flags.includes(flag)) {
      this.flags.push(flag);
    }
  }

  public get bits() {
    return this.flags.reduce((acc, flag) => acc | flag, 0);
  }

  constructor(typeFlag: number) {
    if (typeFlag & PacketFlag.Ack) {
      this.flags.push(PacketFlag.Ack);
    }
    if (typeFlag & PacketFlag.Reliable) {
      this.flags.push(PacketFlag.Reliable);
    }
    if (typeFlag & PacketFlag.NeedAck) {
      this.flags.push(PacketFlag.NeedAck);
    }
    if (typeFlag & PacketFlag.HasSize) {
      this.flags.push(PacketFlag.HasSize);
    }
  }
}
