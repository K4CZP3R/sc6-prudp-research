export class StationURL {
  scheme: string;
  address: string;
  port: number;
  params: Map<string, string>;

  constructor(
    scheme: string,
    address: string,
    port: number,
    params: Map<string, string>
  ) {
    this.scheme = scheme;
    this.address = address;
    this.port = port;
    this.params = params;
  }
}

export class RVConnectionData {
  urlRegularProtocols: string;
  lsrSpecialProtocols: Buffer;
  urlSpecialProtocols: string;

  constructor(
    urlRegularProtocols: string,
    lsrSpecialProtocols: Buffer,
    urlSpecialProtocols: string
  ) {
    this.urlRegularProtocols = urlRegularProtocols;
    this.lsrSpecialProtocols = lsrSpecialProtocols;
    this.urlSpecialProtocols = urlSpecialProtocols;
  }
}
