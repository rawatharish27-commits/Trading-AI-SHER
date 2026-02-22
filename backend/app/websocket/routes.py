"""
WebSocket Routes
FastAPI WebSocket endpoints
"""

import json
import uuid
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from loguru import logger

from app.websocket.manager import (
    connection_manager,
    market_streamer,
    SubscriptionMode,
)

router = APIRouter()


@router.websocket("/ws/market")
async def websocket_market(websocket: WebSocket):
    """
    Market Data WebSocket Endpoint
    
    Protocol:
    1. Connect: Client receives connection acknowledgment
    2. Subscribe: {"action": "subscribe", "symbols": ["RELIANCE", "TCS"]}
    3. Unsubscribe: {"action": "unsubscribe", "symbols": ["RELIANCE"]}
    4. Set Mode: {"action": "set_mode", "mode": "QUOTE"}
    5. Receive: Real-time market data updates
    """
    # Generate unique client ID
    client_id = str(uuid.uuid4())[:8]
    
    await connection_manager.connect(websocket, client_id)
    
    try:
        # Send connection acknowledgment
        await connection_manager.send_to_client(client_id, {
            "type": "connected",
            "client_id": client_id,
            "message": "Connected to market data stream"
        })
        
        # Start streamer if not running
        if not market_streamer.is_running:
            await market_streamer.start()
        
        # Message loop
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                action = message.get("action", "")
                
                if action == "subscribe":
                    symbols = message.get("symbols", [])
                    mode = message.get("mode", "LTP")
                    
                    await connection_manager.subscribe(
                        client_id,
                        symbols,
                        SubscriptionMode(mode)
                    )
                    
                    await connection_manager.send_to_client(client_id, {
                        "type": "subscribed",
                        "symbols": list(connection_manager.get_client_symbols(client_id))
                    })
                
                elif action == "unsubscribe":
                    symbols = message.get("symbols", [])
                    await connection_manager.unsubscribe(client_id, symbols)
                    
                    await connection_manager.send_to_client(client_id, {
                        "type": "unsubscribed",
                        "symbols": symbols
                    })
                
                elif action == "set_mode":
                    mode = message.get("mode", "LTP")
                    if client_id in connection_manager.subscriptions:
                        connection_manager.subscriptions[client_id].mode = SubscriptionMode(mode)
                    
                    await connection_manager.send_to_client(client_id, {
                        "type": "mode_changed",
                        "mode": mode
                    })
                
                elif action == "ping":
                    await connection_manager.send_to_client(client_id, {
                        "type": "pong",
                        "timestamp": str(uuid.uuid4())
                    })
                
                elif action == "get_subscriptions":
                    await connection_manager.send_to_client(client_id, {
                        "type": "subscriptions",
                        "symbols": list(connection_manager.get_client_symbols(client_id))
                    })
                
                else:
                    await connection_manager.send_to_client(client_id, {
                        "type": "error",
                        "message": f"Unknown action: {action}"
                    })
            
            except json.JSONDecodeError:
                await connection_manager.send_to_client(client_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            
            except Exception as e:
                logger.error(f"WebSocket message error: {e}")
                await connection_manager.send_to_client(client_id, {
                    "type": "error",
                    "message": str(e)
                })
    
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        connection_manager.disconnect(client_id)


@router.websocket("/ws/signals")
async def websocket_signals(websocket: WebSocket):
    """
    Signal Stream WebSocket Endpoint
    
    Receives real-time AI signals
    """
    client_id = str(uuid.uuid4())[:8]
    
    await websocket.accept()
    
    try:
        await websocket.send_json({
            "type": "connected",
            "client_id": client_id,
            "message": "Connected to signal stream"
        })
        
        while True:
            data = await websocket.receive_text()
            # Handle signal subscription
            
    except WebSocketDisconnect:
        logger.info(f"Signal client {client_id} disconnected")
