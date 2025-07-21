from dynamixel_sdk import *

# Constants for MX-64 (Protocol 1.0)
ADDR_TORQUE_ENABLE      = 24
ADDR_GOAL_POSITION      = 30
ADDR_PRESENT_POSITION   = 36
ADDR_CW_ANGLE_LIMIT     = 6
ADDR_CCW_ANGLE_LIMIT    = 8

PROTOCOL_VERSION        = 1.0
DXL_ID                  = 1
BAUDRATE                = 57600
DEVICENAME              = '/dev/ttyUSB6'

TORQUE_ENABLE           = 1
TORQUE_DISABLE          = 0
DXL_RESOLUTION          = 4096  # 0–4095 corresponds to 0–360°

def move_to_degree(degree):
    if not (0 <= degree <= 360):
        raise ValueError("Degree must be between 0 and 360")

    position = int((degree / 360.0) * (DXL_RESOLUTION - 1))

    # Initialize port and packet handlers
    portHandler = PortHandler(DEVICENAME)
    packetHandler = PacketHandler(PROTOCOL_VERSION)

    if not portHandler.openPort():
        raise IOError("Failed to open port")

    if not portHandler.setBaudRate(BAUDRATE):
        raise IOError("Failed to set baudrate")

    # Disable torque to allow EEPROM write
    packetHandler.write1ByteTxRx(portHandler, DXL_ID, ADDR_TORQUE_ENABLE, TORQUE_DISABLE)

    # Ensure Joint Mode
    packetHandler.write2ByteTxRx(portHandler, DXL_ID, ADDR_CW_ANGLE_LIMIT, 0)
    packetHandler.write2ByteTxRx(portHandler, DXL_ID, ADDR_CCW_ANGLE_LIMIT, 4095)

    # Enable torque
    dxl_comm_result, dxl_error = packetHandler.write1ByteTxRx(
        portHandler, DXL_ID, ADDR_TORQUE_ENABLE, TORQUE_ENABLE)
    if dxl_comm_result != COMM_SUCCESS:
        raise RuntimeError(f"Torque enable failed: {packetHandler.getTxRxResult(dxl_comm_result)}")

    # Send goal position
    dxl_comm_result, dxl_error = packetHandler.write2ByteTxRx(
        portHandler, DXL_ID, ADDR_GOAL_POSITION, position)
    if dxl_comm_result != COMM_SUCCESS:
        raise RuntimeError(f"Failed to send goal position: {packetHandler.getTxRxResult(dxl_comm_result)}")

    print(f"✅ Moving to {degree}° ({position})")

    # Wait until movement is complete
    while True:
        dxl_present_position, dxl_comm_result, dxl_error = packetHandler.read2ByteTxRx(
            portHandler, DXL_ID, ADDR_PRESENT_POSITION)
        if dxl_comm_result != COMM_SUCCESS:
            print(f"[TxRxResult] {packetHandler.getTxRxResult(dxl_comm_result)}")
            break

        if abs(dxl_present_position - position) < 10:
            break

    print("✅ Movement complete.")
    portHandler.closePort()


#move_to_degree(0)   # Rotate to 90°
#move_to_degree(360)  # Rotate to 270
