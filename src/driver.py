#!/usr/bin/env python3
import asyncio
import websockets
import json
import socket
import signal
import os
import time
import serial
import dynamixellib


from loco_lib_uart import velocity_control_loco, start_devs, change_color, scictl
from arm_lib_can import set_velocity_loop, start_bus, start_bus


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

#start_bus()
start_devs()

degree=0


# Handle WebSocket connections - updated to make path parameter optional
async def handle_websocket(websocket, path=None):
    global degree
    client_address = websocket.remote_address
    print(f"New connection from {client_address}")

    active_connections.add(websocket)

    try:
        await websocket.send(json.dumps({"status": "connected", "message": "Connected to bridge"}))
        change_color(b'x')
        change_color(b'g')
        async for message in websocket:
            #print(message)
            try:
                data = json.loads(message)
                rgbd= data["rgb"]
                arm_com = data["arm_command"]
                print(arm_com)
                motor_params = data["motorparams"]
                if rgbd == 'red':
                    change_color(b'r')
                if rgbd == 'green':
                    change_color(b'g')
                if rgbd == 'blue':
                    change_color(b'b')
                #print(data)
                if arm_com == 'c':
                    set_velocity_loop(12, 200, 200)
                    set_velocity_loop(12, 200, 200)
                    set_velocity_loop(12, 200, 200)
                    set_velocity_loop(12, 200, 200)
                if arm_com == 'v':
                    set_velocity_loop(13, 200, 200)
                    set_velocity_loop(13, 200, 200)
                    set_velocity_loop(13, 200, 200)
                    set_velocity_loop(13, 200, 200)
                if arm_com == 'n':
                    set_velocity_loop(16, 200, 200)
                    set_velocity_loop(16, 200, 200)
                    set_velocity_loop(16, 200, 200)
                    set_velocity_loop(16, 200, 200)
                if arm_com == 'b':
                    set_velocity_loop(15, 200, 200)
                    set_velocity_loop(15, 200, 200)
                    set_velocity_loop(15, 200, 200)
                    set_velocity_loop(15, 200, 200)
                if arm_com == 'u':
                    dynamixellib.move_to_degree(degree+10)
                    degree=(degree+10)%360
                if arm_com == 'j':
                    dynamixellib.move_to_degree(degree-10)
                    degree=(degree-10)%360

                if arm_com == 'i':
                    scictl(b'i')
                if arm_com == 'k':
                    scictl(b'k')

                if "linear" in data and "angular" in data:
                    linear, angular = data["linear"], data["angular"]
                    #print(can_recive())
                    # if linear!=0 or angular!=0:
                    velocity_control_loco(angular, linear, motor_params)
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
                os.system("resetcan1.sh")

                await websocket.send(json.dumps({"status": "error", "message": str(e)}))

    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed from {client_address}: {e.code} - {e.reason}")
    finally:
        active_connections.remove(websocket)
        print(f"Connection from {client_address} closed, {len(active_connections)} active connections")
        change_color(b'x')
        time.sleep(5)
        change_color(b'r')

# Graceful shutdown
async def shutdown():
    print("Shutting down server...")

    if active_connections:
        print(f"Closing {len(active_connections)} active connections...")
        await asyncio.gather(*(conn.close(1001, "Server shutdown") for conn in active_connections), return_exceptions=True)


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
