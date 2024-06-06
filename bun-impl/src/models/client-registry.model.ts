import type { ClientInfo } from "./client-info.model";

export class ClientRegistry {
  clients: Map<number, ClientInfo> = new Map();
  connectionIdSessionIds: Map<number, number> = new Map(); // conId & signature
}
