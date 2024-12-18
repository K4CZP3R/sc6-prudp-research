import { Adbuf } from "../helpers/adbuf";
import { QuazalHelpers } from "../helpers/quazal";

export class LoginExRequest {
  static fromBuffer(params: Adbuf | Buffer) {
    if (!(params instanceof Adbuf)) {
      params = new Adbuf(params);
    }

    let user = QuazalHelpers.readString(params);
    let className = QuazalHelpers.readString(params);

    params.readU32();
    params.readU32();

    let username, onlineKey, password;
    switch (className) {
      case "UbiAuthenticationLoginCustomData":
        username = QuazalHelpers.readString(params);
        onlineKey = QuazalHelpers.readString(params);
        password = QuazalHelpers.readString(params);
    }

    return new LoginExRequest(user, className, username, onlineKey, password);
  }

  constructor(
    public user: string,
    public className: string,
    public username?: string,
    public onlineKey?: string,
    public password?: string
  ) {}

  toBuffer() {
    let result = new Adbuf(Buffer.alloc(0));

    QuazalHelpers.writeString(result, this.user);
    QuazalHelpers.writeString(result, this.className);

    let m = new Adbuf(Buffer.alloc(0));
    QuazalHelpers.writeString(m, this.username);
    QuazalHelpers.writeString(m, this.onlineKey);
    QuazalHelpers.writeString(m, this.password);

    let buff = m.realBuffer;
    result.addU32L(buff.length + 4);
    result.addU32L(buff.length);

    result.add(buff);

    return result.realBuffer;
  }
}
