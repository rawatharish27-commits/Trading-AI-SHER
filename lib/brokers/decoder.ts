/**
 * 🦁 SMARTSTREAM BINARY DECODER (V2)
 * Decodes high-frequency binary packets into normalized JSON objects.
 */
export enum PacketMode {
  LTP = 1,
  QUOTE = 2,
  SNAPQUOTE = 3
}

export interface DecodedTick {
  token: string;
  ltp: number;
  timestamp: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  mode: PacketMode;
}

export class BinaryDecoder {
  /**
   * Parses raw ArrayBuffer into a normalized tick.
   * Following the official V2 Specification (Little Endian).
   */
  static decode(buffer: ArrayBuffer): DecodedTick | null {
    const view = new DataView(buffer);
    try {
      const mode = view.getInt8(0) as PacketMode;
      
      // 1. Extract Token (Fixed 25 bytes)
      let token = "";
      for (let i = 0; i < 25; i++) {
        const char = view.getUint8(2 + i);
        if (char === 0) break;
        token += String.fromCharCode(char);
      }

      // 2. Extract LTP (8 bytes @ offset 43)
      const ltpPaise = view.getBigInt64(43, true);
      const ltp = Number(ltpPaise) / 100;

      // 3. Extract Exchange Timestamp (8 bytes @ offset 35)
      const timestamp = Number(view.getBigInt64(35, true));

      const tick: DecodedTick = { token, ltp, timestamp, mode };

      // 4. Extract Extended Data for Quote Mode
      if (mode >= PacketMode.QUOTE && buffer.byteLength >= 123) {
        tick.volume = Number(view.getBigInt64(67, true));
        tick.open = Number(view.getBigInt64(91, true)) / 100;
        tick.high = Number(view.getBigInt64(99, true)) / 100;
        tick.low = Number(view.getBigInt64(107, true)) / 100;
        tick.close = Number(view.getBigInt64(115, true)) / 100;
      }

      return tick;
    } catch (e) {
      console.error("🦁 [Decoder] Shard Corruption:", e);
      return null;
    }
  }
}