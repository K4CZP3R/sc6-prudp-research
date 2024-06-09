import { Adbuf } from "../helpers/adbuf";
import { QuazalHelpers } from "../helpers/quazal";

export class LoginExRequest {
  user: string;
  className: string;
  username?: string;
  onlineKey?: string;
  password?: string;
  constructor(params: Adbuf) {
    this.user = QuazalHelpers.readString(params);
    this.className = QuazalHelpers.readString(params);

    params.readU32();
    params.readU32();

    switch (this.className) {
      case "UbiAuthenticationLoginCustomData":
        this.username = QuazalHelpers.readString(params);
        this.onlineKey = QuazalHelpers.readString(params);
        this.password = QuazalHelpers.readString(params);
    }
  }

  toBuffer() {
    let result = new Adbuf(Buffer.alloc(0));

    QuazalHelpers.writeString(result, this.user);
    QuazalHelpers.writeString(result, this.className);

    let m = new Adbuf(Buffer.alloc(0));
    QuazalHelpers.writeString(m, this.username);
    QuazalHelpers.writeString(m, this.onlineKey);
    QuazalHelpers.writeString(m, this.password);

    result.addU32L(m.length + 4);
    result.addU32(m.length);

    // Append m to result
    return Buffer.concat([result.realBuffer, m.realBuffer]);
  }
}
