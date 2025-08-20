from dynamixel_sdk import *
import time


PROTOCOL_VERSION = 1.0
ADDR_CW_ANGLE_LIMIT = 6
ADDR_CCW_ANGLE_LIMIT = 8
ADDR_TORQUE_ENABLE = 24
ADDR_MOVING_SPEED = 32

dxl_id = 1

portHandler = PortHandler("/dev/dynamixelUSB")
packetHandler = PacketHandler(PROTOCOL_VERSION)

if not portHandler.openPort():
    raise Exception("Failed to open port")
if not portHandler.setBaudRate(57600):
    raise Exception("Failed to set baudrate")

packetHandler.write2ByteTxRx(portHandler, dxl_id, ADDR_CW_ANGLE_LIMIT, 0)
packetHandler.write2ByteTxRx(portHandler, dxl_id, ADDR_CCW_ANGLE_LIMIT, 0)
packetHandler.write1ByteTxRx(portHandler, dxl_id, ADDR_TORQUE_ENABLE, 1)

def set_dynamixel_speed(
    port: str,
    baudrate: int,
    speed: int,
    direction: str = "CW"
):
    global portHandler, packetHandler, PROTOCOL_VERSION, ADDR_CW_ANGLE_LIMIT, ADDR_CCW_ANGLE_LIMIT, ADDR_TORQUE_ENABLE, ADDR_MOVING_SPEED
    """
    Runs a Dynamixel MX-64 motor at a given speed for a duration in Wheel Mode.

    Parameters:
        dxl_id (int): Dynamixel ID
        port (str): Serial port (e.g., '/dev/ttyUSB0')
        baudrate (int): Baud rate (e.g., 57600)
        speed (int): Speed value (0–1023)
        duration (float): Duration in seconds to run the motor
        direction (str): 'CW' or 'CCW'
    """

    # Apply direction
    if direction.upper() == "CW":
        dxl_speed = speed + 1024
    else:
        dxl_speed = speed

    # Send speed
    packetHandler.write2ByteTxRx(portHandler, dxl_id, ADDR_MOVING_SPEED, dxl_speed)

    if hasattr(portHandler, 'ser'):
        portHandler.ser.flush()

