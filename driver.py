#!/usr/bin/env python3
import asyncio
import websockets
import json
import socket
import signal
import os
import time
from loco_lib import *

#try:
#    from RGBGPIO2 import *
#except:
#    pass

# Configuration
#UDP_IP = "192.168.1.3"  # Rover's IP address
#UDP_PORT = 12344        # Rover's UDP port
WS_PORT = 8765          # WebSocket server port

# Create UDP socket
#udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Track active connections
active_connections = set()

start_bus()


# Handle WebSocket connections - updated to make path parameter optional
async def handle_websocket(websocket, path=None):
    client_address = websocket.remote_address
    print(f"New connection from {client_address}")

    active_connections.add(websocket)

    try:
        await websocket.send(json.dumps({"status": "connected", "message": "Connected to bridge"}))

        async for message in websocket:
            print(message)
            try:
                data = json.loads(message)
                rgbd= data["rgb"].lstrip('#')
                # rgbl = list(int(rgbd[i:i+2], 16) for i in (0, 2, 4))
                # f = open("rgb.txt","w+")
                # f.write(rgbd)
                # f.close()
                #if data["rgb"] !="#000000":
                #    time.sleep(2)
                #    os.system(f"python cParam.py 13 {rgbl[1]} & python cParam.py 15 {rgbl[2]} & python cParam.py 18 {rgbl[0]}")
                if "linear" in data and "angular" in data:
                    linear, angular = data["linear"], data["angular"]
                    #print(can_recive())
                    if linear!=0 or angular!=0:
                        velocity_control_loco(angular, linear)
                        await websocket.send(json.dumps({"status": "sent", "linear": linear, "angular": angular}))
                elif "command" in data:
                    command = data["command"]

                    if command == "emergency_stop":
                        #set_brake_current(5,2)
                        #set_brake_current(3,2)
                        #print(can_recive())
                        await websocket.send(json.dumps({"status": "emergency_stop_sent"}))

                    elif command == "resume_control":
                        print("Resume control received")
                        await websocket.send(json.dumps({"status": "resume_control_acknowledged"}))

                    elif command == "disconnect":
                        print(f"Client {client_address} requested disconnect")
                        break

                    elif command == "ping":
                        await websocket.send(json.dumps({"status": "pong", "timestamp": data.get("timestamp", 0)}))

            except json.JSONDecodeError:
                print(f"Invalid JSON received: {message}")
                await websocket.send(json.dumps({"status": "error", "message": "Invalid JSON format"}))

            except Exception as e:
                print(f"Error processing message: {e}")
                os.system("resetcan0.sh")

                await websocket.send(json.dumps({"status": "error", "message": str(e)}))

    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed from {client_address}: {e.code} - {e.reason}")
    finally:
        active_connections.remove(websocket)
        print(f"Connection from {client_address} closed, {len(active_connections)} active connections")


# Graceful shutdown
async def shutdown():
    print("Shutting down server...")

    if active_connections:
        print(f"Closing {len(active_connections)} active connections...")
        await asyncio.gather(*(conn.close(1001, "Server shutdown") for conn in active_connections), return_exceptions=True)

    stop_bus()

# Main function
async def main():
    print(f"Web to Motor Bridge")
    print(f"WebSocket server starting on port {WS_PORT}")

    # Create the server
    server = await websockets.serve(handle_websocket, "0.0.0.0", WS_PORT)
    print("Server started successfully. Press Ctrl+C to stop.")

    try:
        await asyncio.Future()  # Keep running forever
    except asyncio.CancelledError:
        await shutdown()
    finally:
        server.close()
        await server.wait_closed()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer shutting down...")
