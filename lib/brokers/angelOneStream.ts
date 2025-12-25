
import { wsWatchdog } from "../services/wsWatchdog";

const STREAM_URL = "wss://smartapisocket.angelone.in/smart-stream";

export enum ExchangeType {
  NSE_CM = 1,
  NSE_FO = 2,
  BSE_CM = 3,
  BSE_FO = 4,
  MCX_FO = 5,
  NCX_FO = 7,
  CDE_FO = 13
}

export enum SubscriptionMode {
  LTP = 1,
  QUOTE = 2,
  SNAP_QUOTE = 3
}

export class AngelOneStream {
  private ws: WebSocket | null = null;
  private pingInterval: any = null;
  private config: { clientCode: string; feedToken: string; apiKey: string };
  private onTick: (data: any) => void;
  private subscriptions: Map<number, string[]> = new Map();

  constructor(config: { clientCode: string; feedToken: string; apiKey: string }, onTick: (data: any) => void) {
    this.config = config;
    this.onTick = onTick;
  }

  connect() {
    if (this.ws) return;

    const url = `${STREAM_URL}?clientCode=${this.config.clientCode}&feedToken=${this.config.feedToken}&apiKey=${this.config.apiKey}`;
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log("🦁 [SmartStream] Neural Bridge Established");
      this.startHeartbeat();
      this.resubscribe();
    };

    this.ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        if (event.data === "pong") wsWatchdog.onTick();
        return;
      }

      const packet = this.parseBinaryPacket(event.data);
      if (packet) {
        this.onTick(packet);
        wsWatchdog.onTick();
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      console.warn("🦁 [SmartStream] Bridge Terminated. Reconnecting...");
      setTimeout(() => this.connect(), 5000);
    };
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  subscribe(exchangeType: ExchangeType, tokens: string[], mode: SubscriptionMode = SubscriptionMode.LTP) {
    this.subscriptions.set(exchangeType, tokens);
    if (this.ws?.readyState === WebSocket.OPEN) {
      const request = {
        action: 1,
        params: {
          mode,
          tokenList: [{ exchangeType, tokens }]
        }
      };
      this.ws.send(JSON.stringify(request));
    }
  }

  private resubscribe() {
    this.subscriptions.forEach((tokens, exchangeType) => {
      this.subscribe(exchangeType, tokens);
    });
  }

  /**
   * Institutional Binary Parser (Little Endian)
   */
  private parseBinaryPacket(buffer: ArrayBuffer) {
    const view = new DataView(buffer);
    try {
      const mode = view.getInt8(0);
      const exchangeType = view.getInt8(1);
      
      // Extract Token (25 bytes starting at index 2)
      let token = "";
      for (let i = 0; i < 25; i++) {
        const charCode = view.getUint8(2 + i);
        if (charCode === 0) break;
        token += String.fromCharCode(charCode);
      }

      // Last Traded Price (LTP) is at index 43 as int64 (8 bytes)
      // Spec says int32 but size 8 and offset 43-51. We read as BigInt for precision.
      const ltpPaise = view.getBigInt64(43, true);
      const ltp = Number(ltpPaise) / 100;

      const packet: any = {
        token,
        mode,
        exchangeType,
        ltp,
        timestamp: Number(view.getBigInt64(35, true))
      };

      // If mode is Quote, parse OHLC (Starts at index 91)
      if (mode >= SubscriptionMode.QUOTE && buffer.byteLength >= 123) {
        packet.open = Number(view.getBigInt64(91, true)) / 100;
        packet.high = Number(view.getBigInt64(99, true)) / 100;
        packet.low = Number(view.getBigInt64(107, true)) / 100;
        packet.close = Number(view.getBigInt64(115, true)) / 100;
        packet.volume = Number(view.getBigInt64(67, true));
      }

      return packet;
    } catch (e) {
      return null;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }
}
