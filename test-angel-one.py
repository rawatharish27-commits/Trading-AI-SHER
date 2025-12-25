import websocket
import json
import time
import threading
import requests

# Angel One WebSocket URLs
ANGEL_ONE_WS_URL = "wss://ws.angelone.in/smart-OrderFeed"  # Example URL, adjust as needed

# Environment variables (replace with actual values)
API_KEY = "your_api_key"
CLIENT_ID = "your_client_id"
PASSWORD = "your_password"
TOTP_SECRET = "your_totp_secret"

def on_message(ws, message):
    print("Received message:", message)
    # Parse and verify live tick data
    try:
        data = json.loads(message)
        if 'type' in data and data['type'] == 'live':
            print("✅ Live tick received:", data)
        else:
            print("Other message type:", data)
    except json.JSONDecodeError:
        print("Non-JSON message:", message)

def on_error(ws, error):
    print("Error:", error)

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws):
    print("Connection opened")
    # Send authentication message
    auth_message = {
        "action": "subscribe",
        "key": API_KEY,
        "secret": "your_secret"  # Adjust based on Angel One API
    }
    ws.send(json.dumps(auth_message))

    # Subscribe to live ticks for a symbol (e.g., RELIANCE)
    subscribe_message = {
        "action": "subscribe",
        "symbols": ["RELIANCE"]
    }
    ws.send(json.dumps(subscribe_message))

def test_websocket():
    ws = websocket.WebSocketApp(ANGEL_ONE_WS_URL,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close,
                                on_open=on_open)

    ws.run_forever()

if __name__ == "__main__":
    print("Testing Angel One WebSocket connection for live ticks...")
    test_websocket()
