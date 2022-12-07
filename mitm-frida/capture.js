var buf2hex = function (buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), function (x) {
      return ("00" + x.toString(16)).slice(-2);
    })
    .join("");
};

let plugInto = {
  // "ADVAPI32.dll": [
  //   "CryptCreateHash",
  //   "CryptHashData",
  //   "CryptGetHashParam",
  //   "CryptDestroyHash",
  // ],
  "WS2_32.dll": ["WSASendTo", "WSARecvFrom"],
  // "WINHTTP.dll": ["WinHttpSendRequest", "WinHttpReceiveResponse"],
  // "KERNEL32.dll": ["OutputDebugStringA", "OutputDebugStringW"],
  // "Blacklist_dx11_game.exe": [
  //   // OpenSSL functions
  //   "SSL_read",
  //   "SSL_write",
  //   "SSL_get_error",
  // ],
};
// 0x21423bb
//0x2145f58,0x219c420,0x219e56a,0x219b409,0x219e117,0x21a163b,0x218d209,0x21849cf,0x218ced8,0x21922e3,0x2194a1c,0x218bbfe,0x21916a5,0x24cd3b6

Interceptor.attach(ptr("0x2145f58"), {
  onEnter: function (args) {
    // We dont know what the arguments are, so we just print memory locations
    // Modify readByteArray
    console.log("REA1D1", Memory.readByteArray(args[0], 0xff));
    console.log("READ2", Memory.readByteArray(args[1], 0xff));
    console.log("READ3", Memory.readByteArray(args[2], 0xff));

    console.log(
      "Called from",
      Thread.backtrace(this.context, Backtracer.ACCURATE)
    );
  },
});
// Plug into 0x21423bb
// Interceptor.attach(ptr("0x21423bb"), {
//   onLeave: function (retval) {
//     console.log("Return value: " + retval);
//   },
//   onEnter: function (args) {
//     // We dont know what the arguments are, so we just print memory locations
//     // Modify readByteArray
//     console.log("READ", Memory.readByteArray(args[0], 0xf));
//     console.log(
//       "Called from",
//       Thread.backtrace(this.context, Backtracer.ACCURATE)
//     );
//   },
// });

// for (let dll in plugInto) {
//   let functions = plugInto[dll];
//   for (let i = 0; i < functions.length; i++) {
//     let func = functions[i];

//     let found = Module.findExportByName(dll, func);
//     if (found) {
//       console.log("Found " + func + " at " + found);
//       Interceptor.attach(found, {
//         onEnter: function (args) {
//           if (func === "WSASendTo") {
//             console.log(
//               "Called from",
//               Thread.backtrace(this.context, Backtracer.ACCURATE)
//             );
//           }
//         },
//       });
//     } else {
//       console.log("Not found " + func);
//     }
//   }
// }
