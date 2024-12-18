import { expect, test } from "bun:test";
import { LoginExRequest } from "./loginex-request.model";
import { Adbuf } from "../helpers/adbuf";

const REAL_PACKET =
  "0f0073616d5f7468655f66697368657200210055626941757468656e7469636174696f6e4c6f67696e437573746f6d44617461003a000000360000000f0073616d5f7468655f666973686572001400414243442d454647482d494a4b4c2d4d4e4f50000d0070617373776f72643132333400";

test("LoginExRequest parsing from buffer", () => {
  const rawBytes = Buffer.from(REAL_PACKET, "hex");

  const loginExRequest = LoginExRequest.fromBuffer(new Adbuf(rawBytes));

  expect(loginExRequest.user).toBe("sam_the_fisher");
  expect(loginExRequest.className).toBe("UbiAuthenticationLoginCustomData");
  expect(loginExRequest.username).toBe("sam_the_fisher");
  expect(loginExRequest.onlineKey).toBe("ABCD-EFGH-IJKL-MNOP");
  expect(loginExRequest.password).toBe("password1234");
});

test("Recreate buffer from LoginExRequest", () => {
  const rawBytes = Buffer.from(REAL_PACKET, "hex");

  const loginExRequest = LoginExRequest.fromBuffer(new Adbuf(rawBytes));
  const buffer = loginExRequest.toBuffer();

  expect(buffer.toString("hex")).toBe(rawBytes.toString("hex"));
});

test("Create own LoginExRequest", () => {
  const myNewRequest = new LoginExRequest(
    "sam_the_fisher",
    "UbiAuthenticationLoginCustomData",
    "sam_the_fisher",
    "ABCD-EFGH-IJKL-MNOP",
    "password1234"
  );

  const myBytes = myNewRequest.toBuffer().toString("hex");
  expect(myBytes).toBe(REAL_PACKET);
});
