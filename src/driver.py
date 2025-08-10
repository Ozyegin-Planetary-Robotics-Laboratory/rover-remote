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
from threading import Timer


from loco_lib_uart import velocity_control_loco, start_devs, change_color, scictl
from arm_lib_can import set_velocity_loop, start_bus, start_bus, set_current_brake


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
# start_devs()

dynamixelChanged = False
armChanged = False

# Handle WebSocket connections - updated to make path parameter optional
async def handle_websocket(websocket, path=None):
    global dynamixelChanged, armChanged
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
                print(data)
                # print(data)
                # commands = data["commands"]

                locoLinear = 0
                locoAngular = 0
                dynamixel = False
                arm = False

                for i in data["commands"]:
                    li = i.split("#")
                    command = li[0]
                    value = float(li[1])

                    if command == "LocoLinear":
                        locoLinear = value
                    elif command == "LocoAngular":
                        locoAngular = value
                    
                    #Science
                    elif command == "ScienceUp":
                        scictl("k")
                    elif command == "ScienceDown":
                        scictl("i")
                    
                    elif command == "DOF1Left":
                        set_velocity_loop(12, 10, 200)
                        arm = True
                    elif command == "DOF1Right":
                        set_velocity_loop(12, -10, 200)
                        arm = True
                    elif command == "DOF1":
                        set_velocity_loop(12, 10 * value, 200)
                        arm = True
                    
                    elif command == "DOF2Up":
                        set_velocity_loop(16, -10, 200)
                        arm = True
                    elif command == "DOF2Down":
                        set_velocity_loop(16, 10, 200)
                        arm = True
                    elif command == "DOF2":
                        set_velocity_loop(16, -10 * value, 200)
                        arm = True
                    
                    elif command == "DOF3Up":
                        set_velocity_loop(13, 10, 200)
                        arm = True
                    elif command == "DOF3Down":
                        set_velocity_loop(13, -10, 200)
                        arm = True
                    
                    elif command == "DOF4Up":
                        set_velocity_loop(14, 10, 200)
                        arm = True
                    elif command == "DOF4Down":
                        set_velocity_loop(14, -10, 200)
                        arm = True
                    
                    elif command == "EndEffectorCCW":
                        #dynamixellib.set_dynamixel_speed(1, "/dev/ttyUSB1", 57600, 10 * value, "CCW")
                        dynamixel = True
                    elif command == "EndEffectorCW":
                        #dynamixellib.set_dynamixel_speed(1, "/dev/ttyUSB1", 57600, 10 * value, "CW")
                        dynamixel = True
                    
                    elif command == "GripperOpen":
                        scictl("o")
                    elif command == "GripperClose":
                        scictl("l")

                    elif command == "Led":
                        change_color(b'x')
                        timer1 = None
                        timer2 = None
                        # change_color(["red","blue","green"][int(value)%3])
                        if value == 1: timer1 = Timer(0.5, change_color, ["red"])
                        elif value == 2: timer1 = Timer(0.5, change_color, ["green"])
                        elif value == 3: timer1 = Timer(0.5, change_color, ["blue"])
                        elif value == 4: timer1 = Timer(0.5, change_color, ["red"]); timer2 = Timer(1.0, change_color, ["green"])
                        elif value == 5: timer1 = Timer(0.5, change_color, ["red"]); timer2 = Timer(1.0, change_color, ["blue"])
                        elif value == 6: timer1 = Timer(0.5, change_color, ["green"]); timer2 = Timer(1.0, change_color, ["blue"])
                        
                        if(timer1): timer1.start()
                        if(timer2): timer2.start()


                velocity_control_loco(locoAngular/4, locoLinear/2, "")

                if not armChanged and arm:
                    armChanged = True
                elif armChanged and not arm:
                    armChanged = False
                    set_velocity_loop(12, 0, 200)
                    set_velocity_loop(13, 0, 200)
                    set_velocity_loop(14, 0, 200)
                    set_velocity_loop(16, 0, 200)

                if not dynamixelChanged and dynamixelChanged:
                    print("dümenden")
                    dynamixelChanged = True
                    #dynamixellib.set_dynamixel_speed(1, "/dev/ttyUSB1",57600,0, "CW")
                elif dynamixelChanged and not dynamixel:
                    dynamixelChanged = False

                timestamp = int(time.time() * 1000)
                await websocket.send(json.dumps({"status": "still_connected", "message": "Command Confirmed", "timestamp": timestamp}))

            except json.JSONDecodeError:
                print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!Invalid JSON received: {message}")
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
