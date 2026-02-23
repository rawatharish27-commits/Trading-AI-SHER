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
    signal_manager,
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

    Protocol:
    1. Connect: Client receives connection acknowledgment
    2. Subscribe: {"action": "subscribe", "symbols": ["RELIANCE", "TCS"], "strategies": ["SMC"], "min_quality": 0.6}
    3. Unsubscribe: {"action": "unsubscribe", "symbols": ["RELIANCE"]}
    4. Set Filters: {"action": "set_filters", "strategies": ["SMC"], "min_quality": 0.7}
    5. Receive: Real-time SMC signal updates
    """
    # Generate unique client ID
    client_id = str(uuid.uuid4())[:8]

    await signal_manager.connect_signals(websocket, client_id)

    try:
        # Send connection acknowledgment
        await signal_manager.send_to_signal_client(client_id, {
            "type": "connected",
            "client_id": client_id,
            "message": "Connected to SMC signal stream"
        })

        # Message loop
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                action = message.get("action", "")

                if action == "subscribe":
                    symbols = message.get("symbols", [])
                    strategies = message.get("strategies", ["SMC"])
                    min_quality = message.get("min_quality", 0.0)

                    await signal_manager.subscribe_signals(
                        client_id,
                        symbols,
                        strategies,
                        min_quality
                    )

                    await signal_manager.send_to_signal_client(client_id, {
                        "type": "subscribed",
                        "symbols": list(signal_manager.signal_subscriptions[client_id].symbols),
                        "strategies": list(signal_manager.signal_subscriptions[client_id].strategies),
                        "min_quality": signal_manager.signal_subscriptions[client_id].min_quality
                    })

                elif action == "unsubscribe":
                    symbols = message.get("symbols", [])
                    await signal_manager.unsubscribe_signals(client_id, symbols)

                    await signal_manager.send_to_signal_client(client_id, {
                        "type": "unsubscribed",
                        "symbols": symbols
                    })

                elif action == "set_filters":
                    strategies = message.get("strategies", ["SMC"])
                    min_quality = message.get("min_quality", 0.0)

                    if client_id in signal_manager.signal_subscriptions:
                        subscription = signal_manager.signal_subscriptions[client_id]
                        subscription.strategies = set(strategies)
                        subscription.min_quality = min_quality

                    await signal_manager.send_to_signal_client(client_id, {
                        "type": "filters_updated",
                        "strategies": strategies,
                        "min_quality": min_quality
                    })

                elif action == "ping":
                    await signal_manager.send_to_signal_client(client_id, {
                        "type": "pong",
                        "timestamp": str(uuid.uuid4())
                    })

                elif action == "get_subscriptions":
                    if client_id in signal_manager.signal_subscriptions:
                        subscription = signal_manager.signal_subscriptions[client_id]
                        await signal_manager.send_to_signal_client(client_id, {
                            "type": "subscriptions",
                            "symbols": list(subscription.symbols),
                            "strategies": list(subscription.strategies),
                            "min_quality": subscription.min_quality
                        })

                else:
                    await signal_manager.send_to_signal_client(client_id, {
                        "type": "error",
                        "message": f"Unknown action: {action}"
                    })

            except json.JSONDecodeError:
                await signal_manager.send_to_signal_client(client_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })

            except Exception as e:
                logger.error(f"Signal WebSocket message error: {e}")
                await signal_manager.send_to_signal_client(client_id, {
                    "type": "error",
                    "message": str(e)
                })

    except WebSocketDisconnect:
        signal_manager.disconnect_signals(client_id)
        logger.info(f"Signal client {client_id} disconnected")

    except Exception as e:
        logger.error(f"Signal WebSocket error: {e}")
        signal_manager.disconnect_signals(client_id)
