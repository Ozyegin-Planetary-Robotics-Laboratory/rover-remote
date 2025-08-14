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
import pyudev


from loco_lib_uart import velocity_control_loco, start_devs, change_color, scictl, locoMotorInfo
from arm_lib_can import set_velocity_loop, start_bus, start_bus, set_current_brake, motor_situations, can_recive


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

armSpeed = 10

start_bus()
start_devs()

dynamixelChanged = False
dynamixelUSB = "/dev/ttyUSB3" # wll choose automatically after

context = pyudev.Context()
# deviceFilterStrings = ["HUB", "Hub", "Linux"]

for device in context.list_devices(subsystem='tty'):
    path = device.get('ID_PATH')
    serial = device.get('ID_SERIAL')
    if path and serial:
        # dynamixel
        if "AD01UZ2Y" in serial:
            dynamixelUSB = device.device_node
            print("dynamixel: " + device.device_node)
        # nano
        elif "1a86_USB_Serial" in serial:
            print("nano: " + device.device_node)

        # print(f"{device.device_node} - {serial} - {path}")


# Handle WebSocket connections - updated to make path parameter optional
async def handle_websocket(websocket, path=None):
    global dynamixelChanged
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
                if len(data["commands"]) > 0: print(data)
                # print(data)
                # commands = data["commands"]

                locoLinear = 0
                locoAngular = 0
                dynamixel = False
                DOFs = [False, False, False, False] # DOF1, DOF2, DOF3, DOF4 
                mp = ""

                for i in data["commands"]:
                    li = i.split("#")
                    command = li[0]
                    value = float(li[1])
                    parameter = ""
                    if len(li) > 2: parameter = li[2]

                    if command == "LocoLinear":
                        locoLinear = value
                        mp = parameter
                    elif command == "LocoAngular":
                        locoAngular = value
                        mp = parameter
                    
                    #Science
                    elif command == "ScienceUp":
                        scictl("k")
                    elif command == "ScienceDown":
                        scictl("i")
                    
                    elif command == "DOF1Left":
                        set_velocity_loop(12, armSpeed/3, 200)
                        DOFs[0] = True
                    elif command == "DOF1Right":
                        set_velocity_loop(12, -armSpeed/3, 200)
                        DOFs[0] = True
                    elif command == "DOF1":
                        set_velocity_loop(12, armSpeed/3 * value, 200)
                        DOFs[0] = True
                    
                    elif command == "DOF2Up":
                        set_velocity_loop(16, -armSpeed, 200)
                        DOFs[1] = True
                    elif command == "DOF2Down":
                        set_velocity_loop(16, armSpeed, 200)
                        DOFs[1] = True
                    elif command == "DOF2":
                        set_velocity_loop(16, -armSpeed * value, 200)
                        DOFs[1] = True
                    
                    elif command == "DOF3Up":
                        set_velocity_loop(13, armSpeed, 200)
                        DOFs[2] = True
                    elif command == "DOF3Down":
                        set_velocity_loop(13, -armSpeed, 200)
                        DOFs[2] = True
                    
                    elif command == "DOF4Up":
                        set_velocity_loop(14, -armSpeed/6, 200)
                        DOFs[3] = True
                    elif command == "DOF4Down":
                        set_velocity_loop(14, armSpeed/6, 200)
                        DOFs[3] = True
                    
                    elif command == "EndEffectorCCW":
                        await DynamixelControl(int(30 * value), "CW") # Reverse direction due to gear
                        dynamixel = True
                    elif command == "EndEffectorCW":
                        await DynamixelControl(int(30 * value), "CCW") # Reverse direction due to gear
                        dynamixel = True
                    
                    elif command == "GripperOpen":
                        scictl(b'o\n')
                    elif command == "GripperClose":
                        scictl(b'l\n')

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


                velocity_control_loco(locoAngular/4, locoLinear/2, mp)

                # Hold dof position if no command
                if not DOFs[0]:
                    set_velocity_loop(12, 0, 200)
                if not DOFs[1]:
                    set_velocity_loop(16, 0, 200)
                if not DOFs[2]:
                    set_velocity_loop(13, 0, 200)
                if not DOFs[3]:
                    set_velocity_loop(14, 0, 200)

                # Stop dynamixel if no command
                if not dynamixelChanged and dynamixel:
                    dynamixelChanged = True
                elif dynamixelChanged and not dynamixel:
                    dynamixelChanged = False
                    print("aloo")
                    await DynamixelControl(0, "CW")

                # Timestamp
                timestamp = int(time.time() * 1000)
                can_recive()

                message = {
                    "loco": locoMotorInfo,
                    "arm": motor_situations,
                }
                await websocket.send(json.dumps({"status": "still_connected", "message": message, "timestamp": timestamp}))
                
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


# speed: int, direction: "CW" or "CCW"
async def DynamixelControl(speed, direction):
    dynamixellib.set_dynamixel_speed(1, dynamixelUSB, 57600, speed, direction)

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
