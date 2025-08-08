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

#start_bus()
start_devs()

dynamixelChanged = False


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
                print(data)
                # print(data)
                # commands = data["commands"]

                loco = False
                locoLinear = 0
                locoAngular = 0
                dynamixel = False

                for i in data["commands"]:
                    li = i.split("#")
                    command = li[0]
                    value = float(li[1])

                    if command == "LocoLinear":
                        loco = True
                        locoLinear = value
                    elif command == "LocoAngular":
                        loco = True
                        locoAngular = value
                    
                    #Science
                    elif command == "ScienceUp":
                        scictl("k")
                    elif command == "ScienceDown":
                        scictl("i")
                    
                    elif command == "DOF1Left":
                        set_velocity_loop(12, 10, 200)
                    elif command == "DOF1Right":
                        set_velocity_loop(12, -10, 200)
                    elif command == "DOF1":
                        set_velocity_loop(12, 10 * value, 200)
                    
                    elif command == "DOF2Up":
                        set_velocity_loop(16, 10, 200)
                    elif command == "DOF2Down":
                        set_velocity_loop(16, -10, 200)
                    elif command == "DOF2":
                        set_velocity_loop(16, 10 * value, 200)
                    
                    elif command == "DOF3Up":
                        set_velocity_loop(13, 10, 200)
                    elif command == "DOF3Down":
                        set_velocity_loop(13, -10, 200)
                    
                    elif command == "DOF4Up":
                        set_velocity_loop(14, 10, 200)
                    elif command == "DOF4Down":
                        set_velocity_loop(14, -10, 200)
                    
                    elif command == "EndEffectorCCW":
                        dynamixellib.set_dynamixel_speed(1, "/dev/ttyUSB1", 57600, 10 * value, "CCW")
                        dynamixel = True
                    elif command == "EndEffectorCW":
                        dynamixellib.set_dynamixel_speed(1, "/dev/ttyUSB1", 57600, 10 * value, "CW")
                        dynamixel = True
                    
                    elif command == "GripperOpen":
                        scictl("o")
                    elif command == "GripperClose":
                        scictl("l")


                velocity_control_loco(locoAngular, locoLinear, "")

                if not dynamixelChanged and dynamixelChanged:
                    print("dumenden")
                    dynamixelChanged = True
                    dynamixellib.set_dynamixel_speed(1, "/dev/ttyUSB1",57600,0, "CW")
                elif dynamixelChanged and not dynamixel:
                    dynamixelChanged = False

                
                # rgbd= data["rgb"]
                # arm_com = data["arm_command"]
                # #print(arm_com)
                # motor_params = data["motorparams"]
                # if rgbd == 'red':
                #     change_color(b'r')
                # if rgbd == 'green':
                #     change_color(b'g')
                # if rgbd == 'blue':
                #     change_color(b'b')
                # #print(data)
                # if arm_com == 'c':
                #     set_velocity_loop(12, 10, 200)
                #     set_velocity_loop(12, 10, 200)
                # if arm_com == 'v':
                #     set_velocity_loop(13, 10, 200)
                #     set_velocity_loop(13, 10, 200)
                # if arm_com == 'n':
                #     set_velocity_loop(16, 10, 200)
                #     set_velocity_loop(16, 10, 200)
                # if arm_com == 'b':
                #     set_velocity_loop(14, 10, 200)
                #     set_velocity_loop(14, 10, 200)
                # if not arm_com=='b'  and not arm_com=='B':
                #     set_current_brake(14,2.5)

                # if arm_com == 'o':
                #     scictl(b'o')
                # if arm_com == 'l':
                #     scictl(b'l')

                # if arm_com == 'i':
                #     scictl(b'i')
                # if arm_com == 'k':
                #     scictl(b'k')



                # if arm_com == 'C':
                #     set_velocity_loop(12, -10, 200)
                #     set_velocity_loop(12, -10, 200)
                # if arm_com == 'V':
                #     set_velocity_loop(13, -10, 200)
                #     set_velocity_loop(13, -10, 200)
                # if arm_com == 'N':
                #     set_velocity_loop(16, -10, 200)
                #     set_velocity_loop(16, -10, 200)
                # if arm_com == 'B':
                #     set_velocity_loop(14, -10, 200)
                #     set_velocity_loop(14, -10, 200)


                # if arm_com == 'u':
                #     dynamixellib.set_dynamixel_speed(1,"/dev/ttyUSB1",57600,10,"CW")
                #     degree=(degree+10)
                # if arm_com == 'j':
                #     dynamixellib.set_dynamixel_speed(1,"/dev/ttyUSB1",57600,10,"CCW")
                #     degree=(degree-10)
                # if arm_com == 'h':
                #     dynamixellib.set_dynamixel_speed(1,"/dev/ttyUSB1",57600,0,"CW")
                #     degree=(degree-10)

                # if arm_com == 'cam':
                #     os.system("python3 /home/kaine/camlk/main.py")

                # if "linear" in data and "angular" in data:
                #     linear, angular = data["linear"], data["angular"]
                #     #print(can_recive())
                #     # if linear!=0 or angular!=0:
                #     velocity_control_loco(angular, linear, motor_params)
                #     await websocket.send(json.dumps({"status": "sent", "linear": linear, "angular": angular}))
                # # if "dyna" in data and data["dynaspeed"]!=[-1,-1]:
                # #     if data["dynaspeed"].index(max(data["dynaspeed"]))==0:
                # #         dynamixellib.set_dynamixel_speed(1,"/dev/ttyUSB6",57600,(max(data["dynaspeed"])+1)*20,"CCW")
                # #         #print("CCW",(max(data["dynaspeed"])+1)*20 )
                # #     elif data["dynaspeed"].index(max(data["dynaspeed"]))==1:
                # #         dynamixellib.set_dynamixel_speed(1,"/dev/ttyUSB6",57600,(max(data["dynaspeed"])+1)*20,"CW")
                # #         #print("CW",(max(data["dynaspeed"])+1)*20 )

                # elif data["dynaspeed"]==[-1,-1]:
                #     dynamixellib.set_dynamixel_speed(1,"/dev/ttyUSB6",57600,0,"CW")
                #     #print("-1,-1")
                # elif "command" in data:
                #     command = data["command"]

                #     if command == "emergency_stop":
                #         #set_brake_current(5,2)
                #         #set_brake_current(3,2)
                #         #print(can_recive())
                #         await websocket.send(json.dumps({"status": "emergency_stop_sent"}))

                #     elif command == "resume_control":
                #         print("Resume control received")
                #         await websocket.send(json.dumps({"status": "resume_control_acknowledged"}))

                #     elif command == "disconnect":
                #         print(f"Client {client_address} requested disconnect")
                #         break

                #     elif command == "ping":
                #         await websocket.send(json.dumps({"status": "pong", "timestamp": data.get("timestamp", 0)}))

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
