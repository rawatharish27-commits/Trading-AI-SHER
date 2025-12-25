
import { wsWatchdog } from "../services/wsWatchdog";
import { tokenStore } from "../services/tokenStore";

const STREAM_URL = "wss://smartapisocket.angelone.in/smart-stream";

/**
 * 🛰️ ANGEL ONE WS SHARD (HARDENED v2)
 * Goal: Real-time NSE/BSE binary feed management with Auth Handshake.
 */
export class AngelOneWS {
  private ws: WebSocket | null = null;
  private onTick: (data: any) => void;
  private config: any;
  private realConnected = false;
  private pingInterval: any = null;

  constructor(config: any, onTick: (data: any) => void) {
    this.config = config;
    this.onTick = onTick;
  }

  async connect() {
    if (this.ws) return;

    const tokens = tokenStore.getTokens();
    if (!tokens.jwt || !tokens.feed) {
      console.error("🦁 [AngelWS] Missing Authorization Shards. Re-auth required.");
      return;
    }

    // Protocol: ClientCode, feedToken, and API Key required in URL for handshake
    const url = `${STREAM_URL}?clientCode=${this.config.clientCode}&feedToken=${tokens.feed}&apiKey=${this.config.apiKey}`;
    
    try {
      this.ws = new WebSocket(url);
      this.ws.binaryType = "arraybuffer";
      
      this.ws.onopen = () => {
        console.log("🦁 [AngelWS] Bridge Socket Connected. Waiting for ACK...");
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          if (event.data === "pong") wsWatchdog.onTick();
          return;
        }

        // 🧱 BINARY PACKET DECODING (LITTLE ENDIAN)
        const view = new DataView(event.data);
        try {
          // Packet Index 43: LTP (Int64), Index 35: Exchange Timestamp (Int64)
          const ltpPaise = view.getBigInt64(43, true);
          const ltp = Number(ltpPaise) / 100;
          const ts = Number(view.getBigInt64(35, true));

          // 🛡️ DATA AUTHENTICITY GUARD
          if (ltp > 0 && ts > 1700000000000) {
            if (!this.realConnected) {
              console.log("✅ [AngelWS] AUTH_ACK: Real Exchange Data Stream Verified.");
              this.realConnected = true;
            }
            
            // Extracting Token (Fixed 25 bytes at index 2)
            let token = "";
            for (let i = 0; i < 25; i++) {
              const char = view.getUint8(2 + i);
              if (char === 0) break;
              token += String.fromCharCode(char);
            }

            this.onTick({ 
              ltp, 
              token, 
              timestamp: ts,
              isReal: true 
            });
            wsWatchdog.onTick();
          }
        } catch (e) {
          console.debug("🦁 [AngelWS] Malformed packet shard bypassed.");
        }
      };

      this.ws.onerror = (err) => console.error("🦁 [AngelWS] Socket Friction:", err);

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.ws = null;
        this.realConnected = false;
        console.warn("🦁 [AngelWS] Real-time bridge terminated. Reconnecting in 5s...");
        setTimeout(() => this.connect(), 5000);
      };
    } catch (err) {
      console.error("🦁 [AngelWS] Critical connection failure:", err);
    }
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  isLive(): boolean {
    return this.realConnected;
  }

  subscribe(tokens: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const sub = {
        action: 1, // 1 = Subscribe
        params: {
          mode: 1, // 1 = LTP Mode
          tokenList: [{ exchangeType: 1, tokens }]
        }
      };
      this.ws.send(JSON.stringify(sub));
      console.log(`🦁 [AngelWS] Subscription dispatched for ${tokens.length} assets.`);
    }
  }

  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.realConnected = false;
  }
}
