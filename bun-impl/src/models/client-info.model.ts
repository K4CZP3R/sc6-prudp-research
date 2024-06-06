export class ClientInfo {
  serverSequenceId: number;
  clientSequenceId: number;
  clientSignature?: number;
  serverSignature: number;
  clientSession: number;
  serverSession: number;
  packetFragments: { [key: number]: number[] };
  socket: any;
  lastSeen: any;
  connectionId?: any;
  userId?: number;

  constructor(debugserverSignature: number) {
    this.serverSequenceId = 1;
    this.clientSequenceId = 1;
    this.serverSignature = debugserverSignature; //Math.floor(Math.random() * 10000000000);
    this.clientSession = 0;
    this.serverSession = 0;
    this.packetFragments = {};
    this.socket = "mock";
    this.lastSeen = new Date();
  }
}
