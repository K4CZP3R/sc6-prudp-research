var buf2hex = function (buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), function (x) {
      return ("00" + x.toString(16)).slice(-2);
    })
    .join("");
};

let plugInto = {
  "ADVAPI32.dll": [
    "CryptCreateHash",
    "CryptHashData",
    "CryptGetHashParam",
    "CryptDestroyHash",
  ],
  "WS2_32.dll": ["sendto", "recv", "gethostname"],
  "WINHTTP.dll": ["WinHttpSendRequest", "WinHttpReceiveResponse"],
  "KERNEL32.dll": ["OutputDebugStringA", "OutputDebugStringW"],
  "Blacklist_dx11_game.exe": [
    // OpenSSL functions
    "SSL_read",
    "SSL_write",
    "SSL_get_error",
  ],
};

for (let dll in plugInto) {
  let functions = plugInto[dll];
  for (let i = 0; i < functions.length; i++) {
    let func = functions[i];

    let found = Module.findExportByName(dll, func);
    if (found) {
      console.log("Found " + func + " at " + found);
      Interceptor.attach(found, {
        onEnter: function (args) {
          console.log("[" + func + "] ");

          if (func === "OutputDebugStringA") {
            console.log("[" + func + "] " + Memory.readCString(args[0]));
          }
          if (func === "send") {
            console.log("[" + func + "] " + Memory.readCString(args[1]));
          }
          if (func === "recv") {
            console.log("[" + func + "] " + Memory.readCString(args[1]));
          }
        },
      });
    } else {
      console.log("Not found " + func);
    }
  }
}
