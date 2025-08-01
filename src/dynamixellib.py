from dynamixel_sdk import *
import time

def set_dynamixel_speed(
    dxl_id: int,
    port: str,
    baudrate: int,
    speed: int,
    direction: str = "CW"
):
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

    # Protocol and control table
    PROTOCOL_VERSION = 1.0
    ADDR_CW_ANGLE_LIMIT = 6
    ADDR_CCW_ANGLE_LIMIT = 8
    ADDR_TORQUE_ENABLE = 24
    ADDR_MOVING_SPEED = 32

    portHandler = PortHandler(port)
    packetHandler = PacketHandler(PROTOCOL_VERSION)

    if not portHandler.openPort():
        print("Failed to open port")
        return

    if not portHandler.setBaudRate(baudrate):
        print("Failed to set baudrate")
        portHandler.closePort()
        return

    # Set wheel mode (velocity mode)
    packetHandler.write2ByteTxRx(portHandler, dxl_id, ADDR_CW_ANGLE_LIMIT, 0)
    packetHandler.write2ByteTxRx(portHandler, dxl_id, ADDR_CCW_ANGLE_LIMIT, 0)

    # Enable torque
    packetHandler.write1ByteTxRx(portHandler, dxl_id, ADDR_TORQUE_ENABLE, 1)

    # Apply direction
    if direction.upper() == "CW":
        dxl_speed = speed + 1024
    else:
        dxl_speed = speed

    # Send speed
    packetHandler.write2ByteTxRx(portHandler, dxl_id, ADDR_MOVING_SPEED, dxl_speed)


set_dynamixel_speed(
    dxl_id=1,
    port="/dev/ttyUSB1",
    baudrate=57600,
    speed=10,
    direction="CW"
)

time.sleep(1)

set_dynamixel_speed(
    dxl_id=1,
    port="/dev/ttyUSB1",
    baudrate=57600,
    speed=0,
    direction="CW"
)
