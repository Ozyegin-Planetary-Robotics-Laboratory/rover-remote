const screens = [
  {
    id: "Blank",
    html: `
      <span>Select a screen</span
    `
  },
  {
    id: "MobileScreen",
    html: `
      <div id="MobileScreen">
        <div class="header">

          <div class="control-panel">
            <button id="emergency-btn">EMERGENCY STOP</button>
            <button id="connect-btn">CONNECT</button>
          </div>
        </div>
        <div id="joystick-container">
          <div class="horizontal-axis"></div>
          <div class="vertical-axis"></div>
          <div id="joystick-knob">STOP</div>
        </div>

        <div id="colorpicker-container">
          <input type="text" id="html5colorpicker" onchange="clickColor(0, -1, -1, 5)" value=""
            style="width:60%;height:15%;">
          <input type="text" id="html5armcom" onchange="clickColor(0, -1, -1, 5)" value="" style="width:60%;height:15%;">
          <input type="text" id="motorparam" onchange="clickColor(0, -1, -1, 5)" value="" style="width:60%;height:15%;">
        </div>
        <input type="checkbox" id='kolkontrol'></input>
        <div class="footer">
          <div id="output">X: 0.00, Y: 0.00</div>
          <div id="ConnectionStatus">Not connected</div>
          <div class="settings">
            <label for="ip-address">Bridge IP Address:</label>
            <input type="text" id="ip-address" value="192.168.1.3">
            <label for="port">Bridge WebSocket Port:</label>
            <input type="number" id="port" value="8765">
          </div>
        </div>
      </div>
    `
  },
  {
    id: "CameraScreen",
    hmtl: `
      <div>
      <span>sea</span>
      </div>
    `
  },
  {
    id: "ControllerScreen",
    html: `
    <div id="ControllerScreen">
     <div onclick="PrintControllerId()" id="PlayerNumber"></div>
     
     <div id=ControllerScreenButtons></div>
    </div>
    `
  },
  {
    id: "StatusScreen",
    html: `
    <div id="StatusScreen">
      <div id="RoverStatusDiv">
        <div class="RoverStatusSectionClass" id="LocoStatusDiv">
          <div style="margin-right: 1rem;">
            <div style="justify-content: start;" class="LocoStatusDivClass">
              <span id="LocoStatusTemp1" class="LocoStatusSpanClass LocoStatusTempratureSpanClass"></span>
              <span id="LocoStatusSpeed1" class="LocoStatusSpanClass LocoStatusSpeedSpanClass"></span>
            </div>
            <div style="justify-content: end;" class="LocoStatusDivClass">
              <span id="LocoStatusTemp2" class="LocoStatusSpanClass LocoStatusTempratureSpanClass"></span>
              <span id="LocoStatusSpeed2" class="LocoStatusSpanClass LocoStatusSpeedSpanClass"></span>
            </div>
          </div>
          
          <div id="RoverStatusImg">
            <img id="EmergencyButton" style="width: 5rem;" src="icons/EmergencyButton.png"></img>
          </div>
          

          <div style="margin-left: 1rem;">
            <div style="justify-content: start;" class="LocoStatusDivClass">
              <span id="LocoStatusTemp3" class="LocoStatusSpanClass LocoStatusTempratureSpanClass"></span>
              <span id="LocoStatusSpeed3" class="LocoStatusSpanClass LocoStatusSpeedSpanClass"></span>
            </div>
            <div style="justify-content: end;" class="LocoStatusDivClass">
              <span id="LocoStatusTemp4" class="LocoStatusSpanClass LocoStatusTempratureSpanClass"></span>
              <span id="LocoStatusSpeed4" class="LocoStatusSpanClass LocoStatusSpeedSpanClass"></span>
            </div>
          </div>
          
        </div>
        <div class="RoverStatusSectionClass" id="ConnectionStatusDiv">
          <span style="margin-bottom: 1rem;">Connection</span>
          <button onclick="connectToBridge()" style="background-color: var(--color-blue)" class="ButtonClass">Connect</button>
          <button onclick="disconnectFromBridge()" style="background-color: var(--color-red); margin-top: 1rem;" class="ButtonClass">Disconnect</button>
        </div>
        <div class="RoverStatusSectionClass" id="LedControlDiv">
          <span>Colors</span>
          <div>
            <button onclick="LedChangeColor('1')" style="background-color: var(--color-red);" class="LedButtonClass"></button>
            <button onclick="LedChangeColor('2')" style="background-color: var(--color-green);" class="LedButtonClass"></button>
            <button onclick="LedChangeColor('3')" style="background-color: var(--color-blue);" class="LedButtonClass"></button>
            <button onclick="LedChangeColor('4')" style="background-color: var(--color-yellow);" class="LedButtonClass"></button>
            <button onclick="LedChangeColor('5')" style="background-color: var(--color-pink);" class="LedButtonClass"></button>
            <button onclick="LedChangeColor('6')" style="background-color: var(--color-cyan);" class="LedButtonClass"></button>
          </div>
        </div>
      </div>
    </div>
    `
  },
  {
    id: "ManipulatorScreen",
    html: `
    <div id="ManipulatorScreen">
      <div id="ManipulatorContainer">
        <div style="margin-top: 400px" id="ManipulatorDOF1" class="ManipulatorDOFClass">
          <div class="joint-circle"></div>
          <div id="ManipulatorLink1" class="ManipulatorLinkClass" style="width:150px;">
            <div id="ManipulatorDOF2" class="ManipulatorDOFClass" style="position:absolute; left:150px; top:0;">
              <div class="joint-circle"></div>
              <div id="ManipulatorLink2" class="ManipulatorLinkClass" style="width:100px;">
                <div id="ManipulatorDOF3" class="ManipulatorDOFClass" style="position:absolute; left:100px; top:0;">
                  <div class="joint-circle"></div>
                  <div id="ManipulatorLink3" class="ManipulatorLinkClass" style="width:50px;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
     </div>

    </div>
    `
  },
]

let screenSelectBoxString = ""
CreateScreenSelectBoxString()


let windowId = 0;
const windowSizeIncrement = 10;
let currentWindows = []

const colorConfigs = [
  {
    type: "latency",
    tresholds: [250, 1000]
  },
  {
    type: "temperature",
    tresholds: [35, 60]
  },
  {
    type: "speed",
    tresholds: [30, 70]
  },

]

// Controller
let controllerScreenOldState = false;
const controllerDeadzone = 0.1

let controllerId = ""
let buttonFunctionsString = ""
const buttonFunctions = [
  // Loco
  { id: "LocoAngular", type: "Axis" },
  { id: "LocoLinear", type: "Axis" },

  // Science
  { id: "ScienceDown", type: "Button" },
  { id: "ScienceUp", type: "Button" },

  // Arm
  { id: "DOF1Left", type: "Button" },
  { id: "DOF1Right", type: "Button" },
  { id: "DOF1", type: "Axis" },

  { id: "DOF2Down", type: "Button" },
  { id: "DOF2Up", type: "Button" },
  { id: "DOF2", type: "Axis" },

  { id: "DOF3Down", type: "Button" },
  { id: "DOF3Up", type: "Button" },

  { id: "DOF4Down", type: "Button" },
  { id: "DOF4Up", type: "Button" },

  { id: "EndEffectorCCW", type: "Button" },
  { id: "EndEffectorCW", type: "Button" },

  { id: "GripperOpen", type: "Button" },
  { id: "GripperClose", type: "Button" },
]

const controllerConfigs = [
  // PS2 Oğuzhan
  {
    ids: ["PS(R) Controller Adaptor (Vendor: 0e8f Product: 0003)", "My-Power CO.,LTD. PS(R) Controller Adaptor (STANDARD GAMEPAD Vendor: 054c Product: 0268)"],
    config: [
      { button: 14, func: "ScienceDown" },
      { button: 12, func: "ScienceUp" },
      { button: 4, func: "GripperOpen" },
      { button: 5, func: "GripperClose" },
      { button: 0, func: "DOF3Down" },
      { button: 2, func: "DOF3Up" },
      { button: 3, func: "DOF4Down" },
      { button: 1, func: "DOF4Up" },
      { axis: 0, func: "LocoAngular" },
      { axis: 1, func: "LocoLinear" },
      { axis: 2, func: "DOF1" },
      { axis: 5, func: "DOF2" },
    ]
  },
  // Xbox Uraz
  {
    ids: ["Xbox 360 Controller (XInput STANDARD GAMEPAD)", "HID uyumlu oyun denetleyicisi (STANDARD GAMEPAD Vendor: 045e Product: 0b13)", "Microsoft Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b12)"],
    config: [
      { button: 13, func: "ScienceDown" },
      { button: 12, func: "ScienceUp" },
      { button: 4, func: "GripperOpen" },
      { button: 5, func: "GripperClose" },
      { button: 3, func: "DOF3Down" },
      { button: 0, func: "DOF3Up" },
      { button: 2, func: "DOF4Down" },
      { button: 1, func: "DOF4Up" },
      { button: 6, func: "EndEffectorCCW" },
      { button: 7, func: "EndEffectorCW" },
      { axis: 0, func: "LocoAngular" },
      { axis: 1, func: "LocoLinear" },
      { axis: 2, func: "DOF1" },
      { axis: 3, func: "DOF2" },
    ]
  },
  // 8bitdo Emre
  {
    ids: ["Windows için Xbox 360 Denetleyicisi (STANDARD GAMEPAD)"],
    config: [
      { button: 13, func: "ScienceDown" },
      { button: 12, func: "ScienceUp" },
      { button: 4, func: "GripperOpen" },
      { button: 5, func: "GripperClose" },
      { button: 3, func: "DOF3Down" },
      { button: 0, func: "DOF3Up" },
      { button: 2, func: "DOF4Down" },
      { button: 1, func: "DOF4Up" },
      { button: 6, func: "EndEffectorCCW" },
      { button: 7, func: "EndEffectorCW" },
      { axis: 0, func: "LocoAngular" },
      { axis: 1, func: "LocoLinear" },
      { axis: 2, func: "DOF1" },
      { axis: 3, func: "DOF2" },
    ]
  },

]

// StatusScreen
let targetLedColor = ""
let disableLedButtons = false

// Connection
const connectionStatus = document.getElementById('ConnectionStatus');
const ipAdress = document.location.host.split(':')[0]
const port = 8765
let isConnected = false
const latencySpan = document.getElementById("LatencySpan")

//#region oldcode
// document.getElementById('ip-address').value = document.location.host.split(':')[0]
// document.addEventListener('DOMContentLoaded', function () {

//   const container = document.getElementById('joystick-container');
//   const colorpicker = document.getElementById('html5colorpicker');
//   const armcom = document.getElementById('html5armcom');
//   const motpar = document.getElementById('motorparam');
//   const knob = document.getElementById('joystick-knob');
//   const output = document.getElementById('output');
//   const emergencyBtn = document.getElementById('emergency-btn');
//   const connectBtn = document.getElementById('connect-btn');
//   // const connectionStatus = document.getElementById('connection-status');
//   const ipAddressInput = document.getElementById('ip-address');
//   const portInput = document.getElementById('port');
//   const kolbox = document.getElementById('kolkontrol');
//   let isEmergency = false;
//   let isDragging = false;
//   let currentX = 0;
//   let currentY = 0;
//   let socket = null;
//   let isConnected = false;
//   let sendInterval = null;
//   let pingInterval = null;
//   let scienceUp = 0
//   let scienceDown = 0
//   let scienceDrill = 0
//   let arm1 = 0
//   let arm2 = 0
//   let arm3 = 0
//   let arm4 = 0
//   let armClockwise = 0
//   let gripper = 0
//   let gripperClockwise = 0
//   const DEADZONE_THRESHOLD = 0.1;
//   let reconnectAttempts = 0;
//   const MAX_RECONNECT_ATTEMPTS = 5;

//   // Get container dimensions and center position
//   let containerRect = container.getBoundingClientRect();
//   let centerX = containerRect.width / 2;
//   let centerY = containerRect.height / 2;

//   // Maximum distance the joystick can move from center (radius - knob radius)
//   let maxDistance = (containerRect.width / 2) - (knob.offsetWidth / 2);

//   // Function to apply a deadzone
//   function applyDeadzone(value, deadzone) {
//     if (Math.abs(value) < deadzone) {
//       return 0.0;
//     }
//     return value;
//   }



//   // Connect button functionality
//   connectBtn.addEventListener('click', function () {
//     if (isConnected) {
//       disconnectFromBridge();
//     } else {
//       connectToBridge();
//     }
//   });

//   connectBtn.addEventListener('input', function () {

//   });

//   // Emergency button functionality
//   emergencyBtn.addEventListener('click', function () {
//     isEmergency = !isEmergency;

//     if (isEmergency) {
//       container.classList.add('disabled');
//       knob.classList.add('emergency');
//       emergencyBtn.textContent = 'RESUME CONTROL';
//       emergencyBtn.classList.add('active');
//       resetJoystickPosition();

//       // Send emergency stop command
//       if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
//         socket.send(JSON.stringify({
//           command: 'emergency_stop',
//           timestamp: Date.now()
//         }));
//         connectionStatus.textContent = 'Emergency stop command sent';
//       }
//     } else {
//       container.classList.remove('disabled');
//       knob.classList.remove('emergency');
//       emergencyBtn.textContent = 'EMERGENCY STOP';
//       emergencyBtn.classList.remove('active');

//       // Send resume command
//       if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
//         socket.send(JSON.stringify({
//           command: 'resume_control',
//           timestamp: Date.now()
//         }));
//         connectionStatus.textContent = 'Control resumed';
//       }
//     }
//   });

//   // Function to update dimensions on resize
//   function updateDimensions() {
//     containerRect = container.getBoundingClientRect();
//     centerX = containerRect.width / 2;
//     centerY = containerRect.height / 2;
//     maxDistance = (containerRect.width / 2) - (knob.offsetWidth / 2);
//   }

//   // Update dimensions on window resize
//   window.addEventListener('resize', updateDimensions);

//   // Function to update joystick position
//   function updateJoystickPosition(clientX, clientY) {
//     if (isEmergency) return;

//     // Calculate position relative to container center
//     const containerRect = container.getBoundingClientRect();
//     let deltaX = clientX - containerRect.left - centerX;
//     let deltaY = clientY - containerRect.top - centerY;

//     // Calculate distance from center
//     const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

//     // If distance is greater than max, normalize
//     if (distance > maxDistance) {
//       const angle = Math.atan2(deltaY, deltaX);
//       deltaX = Math.cos(angle) * maxDistance;
//       deltaY = Math.sin(angle) * maxDistance;
//     }

//     // Update knob position
//     knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

//     // Calculate normalized values (-1 to 1)
//     if (kolbox["checked"] == false) {
//       currentX = parseFloat((deltaX / maxDistance).toFixed(2));
//       currentY = parseFloat((-deltaY / maxDistance).toFixed(2)); // Invert Y axis to match the C++ code
//     }
//     // Update output display
//     output.textContent = `X: ${currentX.toFixed(2)}, Y: ${currentY.toFixed(2)}`;
//   }

//   // Function to reset joystick position
//   function resetJoystickPosition() {
//     knob.style.transform = 'translate(-50%, -50%)';
//     currentX = 0;
//     currentY = 0;
//     output.textContent = 'X: 0.00, Y: 0.00';
//   }

//   // Mouse event handlers
//   container.addEventListener('mousedown', function (e) {
//     if (isEmergency) return;
//     isDragging = true;
//     updateJoystickPosition(e.clientX, e.clientY);
//   });

//   document.addEventListener('mousemove', function (e) {
//     if (isDragging && !isEmergency) {
//       updateJoystickPosition(e.clientX, e.clientY);
//     }
//   });

//   document.addEventListener('mouseup', function () {
//     if (isDragging) {
//       isDragging = false;
//       resetJoystickPosition();
//     }
//   });

//   // Touch event handlers
//   container.addEventListener('touchstart', function (e) {
//     if (isEmergency) return;
//     isDragging = true;
//     updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
//     e.preventDefault(); // Prevent scrolling
//   });

//   document.addEventListener('touchmove', function (e) {
//     if (isDragging && !isEmergency) {
//       updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
//       e.preventDefault(); // Prevent scrolling
//     }
//   });

//   document.addEventListener('touchend', function () {
//     if (isDragging) {
//       isDragging = false;
//       resetJoystickPosition();
//     }
//   });

//   // Handle page visibility changes to prevent sending data when tab is not active
//   document.addEventListener('visibilitychange', function () {
//     if (document.hidden && isDragging) {
//       isDragging = false;
//       resetJoystickPosition();
//     }
//   });

//   // Handle page unload to clean up connection
//   window.addEventListener('beforeunload', function () {
//     if (isConnected && socket) {
//       socket.close(1000, 'Page unloaded');
//     }
//   });

//   // Initialize dimensions
//   updateDimensions();
// });

//#endregion

AddWindow()
// SelectScreen("screenDiv1", "MobileScreen")
// SelectScreen("screenDiv1", "ControllerScreen")
// SelectScreen("screenDiv1", "ManipulatorScreen")
SelectScreen("screenDiv1", "StatusScreen")

//#region FUNCTIONS

// #region Windows and Screens
function AddWindow() {
  windowId++
  document.getElementById("WindowsDiv").innerHTML += `
    <div style="width: 100%" id="window${windowId}" class="WindowClass">
      <div class="WindowTopClass">
        <select id="WindowSelectBox${windowId}" onchange="SelectScreen('screenDiv${windowId}', this.value)" name="" class="SelectBoxClass WindowSelectBox">
          ${screenSelectBoxString}
        </select>
        <div class="WindowControlDiv">
          <button onclick="ChangeWindowSize('window${windowId}', -1)" class="WindowControlButtonClass">-</button>
          <button onclick="ChangeWindowSize('window${windowId}', 1)" class="WindowControlButtonClass">+</button>
          <button onclick="ChangeOrder('window${windowId}', -1)" class="WindowControlButtonClass"><</button>
          <button onclick="ChangeOrder('window${windowId}', 1)" class="WindowControlButtonClass">></button>
          <button onclick="CloseWindow('window${windowId}')" style="border: none;" class="WindowControlButtonClass">x</button>
        </div>
      </div>
      <div id="screenDiv${windowId}"></div>
    </div>
  `
  currentWindows.push({ windowId: 'window' + windowId, screenId: "Blank" })
  SelectScreen('screenDiv' + windowId, "Blank")
}

function GetScreenHTML(id) {
  for (let i = 0; i < screens.length; i++) {
    const screen = screens[i];
    if (screen.id == id) return screen.html
  }
}

function CreateScreenSelectBoxString() {
  for (let i = 0; i < screens.length; i++) {
    const screen = screens[i];
    screenSelectBoxString += `<option value="${screen.id}">${screen.id}</option>\n`
  }
}

function SelectScreen(screenDivId, screenId) {
  document.getElementById(screenDivId).innerHTML = GetScreenHTML(screenId)
  const windowId = "window" + screenDivId.slice("screenDiv".length)

  FindProperty(currentWindows, "windowId", windowId).screenId = screenId
  UpdateScreenSelectBoxOptions()
}

function UpdateScreenSelectBoxOptions() {
  for (let a = 0; a < currentWindows.length; a++) {
    const window = currentWindows[a];
    const selectboxId = "WindowSelectBox" + window.windowId.slice("window".length)
    const children = document.getElementById(selectboxId).children

    for (let i = 0; i < children.length; i++) {
      const option = children[i];

      if (option.value != "Blank" && window.screenId != option.value && FindProperty(currentWindows, "screenId", option.value)) {
        option.disabled = true
      }
      // After some changes the value of the selectbox started to change when a new window is added.
      // I have no idea why. The else if condition below is for temporary fix.
      else if (window.screenId == option.value) {
        option.selected = true
      }
      else {
        option.disabled = false
      }
    }
  }
}

function ChangeWindowSize(id, size) {
  const targetWindow = document.getElementById(id)
  console.log(parseInt(targetWindow.style.width.slice(0, -1)) + windowSizeIncrement * size)
  targetWindow.style.width = (parseInt(targetWindow.style.width.slice(0, -1)) + windowSizeIncrement * size) + "%";
}

function CloseWindow(id) {
  document.getElementById(id).remove();
  const index = currentWindows.indexOf(id)
  currentWindows.splice(index, 1)
  UpdateScreenSelectBoxOptions()
}

function ChangeOrder(id, direction) {
  if (currentWindows.length <= 1) return
  const window = FindProperty(currentWindows, "windowId", id)
  const index = currentWindows.indexOf(window)

  if (index == 0 && direction < 0) return
  else if (index == currentWindows.length - 1 & direction > 1) return

  currentWindows.splice(index, 1)
  currentWindows.splice(index + direction, 0, window)

  for (let i = 0; i < currentWindows.length; i++) {
    const window = document.getElementById(currentWindows[i].windowId);
    window.style.order = i
  }
}

//#endregion

//#region ControllerScreen
CreateButtonFunctionsString()

function CreateButtonFunctionsString() {
  buttonFunctionsString += '<option value="none">none</option>\n'
  for (let i = 0; i < buttonFunctions.length; i++) {
    const func = buttonFunctions[i];
    buttonFunctionsString += `
    <option value="${func.id}">${func.id}</option>\n
    `
  }
}

function PrintControllerId() {
  console.log(controllerId)
}

function GetControllerConfigFunction(type, id) {
  for (let i = 0; i < controllerConfigs.length; i++) {
    const controllerConfig = controllerConfigs[i];
    if(controllerConfig.ids.includes(controllerId)){
      const config = controllerConfig.config
      const subConfig = FindProperty(config, type, id)
      return subConfig != undefined ? subConfig.func : "none"
    }
  }
}
//#endregion

//#region ManipulatorScreen
// updateArm(45,-45,-45)
function updateArm(dof2, dof3, dof4) {
  document.getElementById('ManipulatorDOF1').style.transform = `rotate(${dof2}deg)`;
  document.getElementById('ManipulatorDOF2').style.transform = `rotate(${dof3}deg)`;
  document.getElementById('ManipulatorDOF3').style.transform = `rotate(${dof4}deg)`;
}

//#endregion

//#region StatusScreen
function UpdateRoverStatus() {
  const temps = [45, 46, 62, 48]
  const speeds = [30, 45, 25, 28]

  for (let i = 0; i < 4; i++) {
    const temp = temps[i]
    const locoStatusTemp = document.getElementById("LocoStatusTemp" + (i + 1))
    locoStatusTemp.textContent = temp
    locoStatusTemp.style.color = ColorCalculator("temperature", temp)

    const speed = speeds[i]
    const locoStatusSpeed = document.getElementById("LocoStatusSpeed" + (i + 1))
    locoStatusSpeed.textContent = speed
    locoStatusSpeed.style.color = ColorCalculator("speed", speed)
  }
}

function LedChangeColor(color){
  if(disableLedButtons) return
  targetLedColor = color
  LedButtonStateChanger(false)
  disableLedButtons = true

  setTimeout(() => {
    disableLedButtons = false
    LedButtonStateChanger(true)
  }, 1000);
}

function LedButtonStateChanger(enabled){
  const ledButtons = document.getElementsByClassName("LedButtonClass")
  for (let i = 0; i < ledButtons.length; i++) {
    const led = ledButtons[i];
    if(enabled){
      led.classList.remove("LedButtonDeactivatedClass")
    }
    else{
      led.classList.add("LedButtonDeactivatedClass")
    }
  }
}
//#endregion

//#region Connection

function connectToBridge() {
  reconnectAttempts = 0;

  try {
    // Create WebSocket connection
    connectionStatus.textContent = `Connecting to bridge at ${ipAdress}:${port}...`;

    // Use WebSocket protocol (ws:// or wss:// for secure)
    socket = new WebSocket(`ws://${ipAdress}:${port}`);

    // Connection opened
    socket.addEventListener('open', function (event) {
      isConnected = true;
      connectionStatus.textContent = `Connected to bridge at ${ipAddress}:${port}`;
      connectionStatus.classList.add('connected');
      connectBtn.textContent = 'DISCONNECT';
      connectBtn.classList.add('connected');

      // Start sending joystick data
      startSendingData();
    });

    // Listen for messages from the server
    socket.addEventListener('message', function (event) {
      try {
        const response = JSON.parse(event.data);
        console.log('Message from bridge:', response);
        
        const currentTime = new Date().getTime()
        console.log(currentTime);

        const latency = currentTime - response.timestamp
        latencySpan.textContent = latency
        latencySpan.style.color = ColorCalculator("latency", latency)

        // Handle different response types
        if (response.status === 'connected') {
          console.log('Connection confirmed by bridge');
        } else if (response.status === 'sent') {
          // Data was successfully sent to the rover
          connectionStatus.textContent = `Sent: Linear=${response.linear.toFixed(2)}, Angular=${response.angular.toFixed(2)}`;
        } else if (response.status === 'emergency_stop_sent') {
          connectionStatus.textContent = 'Emergency stop sent to rover';
        } else if (response.status === 'resume_control_acknowledged') {
          connectionStatus.textContent = 'Control resumed';
        } else if (response.status === 'error') {
          console.error('Error from bridge:', response.message);
          connectionStatus.textContent = `Error: ${response.message}`;
        }
      } catch (error) {
        console.error('Error parsing bridge response:', error);
      }
    });

    // Connection closed
    // socket.addEventListener('close', function (event) {
    //   if (isConnected) {
    //     isConnected = false;
    //     connectionStatus.textContent = `Connection closed: ${event.reason || 'Unknown reason'}`;
    //     connectionStatus.classList.remove('connected');
    //     // connectBtn.textContent = 'CONNECT';
    //     // connectBtn.classList.remove('connected');

    //     // if (sendInterval) {
    //     //   clearInterval(sendInterval);
    //     //   sendInterval = null;
    //     // }

    //     // if (pingInterval) {
    //     //   clearInterval(pingInterval);
    //     //   pingInterval = null;
    //     // }

    //     // Try to reconnect if not manually disconnected
    //     // if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    //     //   reconnectAttempts++;
    //     //   connectionStatus.textContent = `Connection lost. Reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`;
    //     //   setTimeout(connectToBridge, 2000); // Try to reconnect after 2 seconds
    //     // }
    //   }
    // });

    // Connection error
    socket.addEventListener('error', function (error) {
      connectionStatus.textContent = `Connection error`;
      console.error('WebSocket error:', error);
    });

  } catch (error) {
    connectionStatus.textContent = `Connection failed: ${error.message}`;
    console.error('Connection error:', error);
  }
}

function disconnectFromBridge() {
  // if (sendInterval) {
  //   clearInterval(sendInterval);
  //   sendInterval = null;
  // }

  // if (pingInterval) {
  //   clearInterval(pingInterval);
  //   pingInterval = null;
  // }

  if (socket) {
    // Send a clean disconnect message if possible
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        command: 'disconnect',
        message: 'User initiated disconnect'
      }));
    }

    // Close the socket
    socket.close(1000, 'User disconnected');
    socket = null;
  }

  isConnected = false;
  connectionStatus.textContent = 'Disconnected';
  connectionStatus.classList.remove('connected');
  reconnectAttempts = 0;
}
//#endregion

//#region General Functions
function FindProperty(array, property, value) {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    if (element[property] == value) return element
  }
}

function ColorCalculator(type, value) {
  const tresholds = FindProperty(colorConfigs, "type", type).tresholds

  if(tresholds[0] >= value) return "var(--color-green)"
  else if(tresholds[1] >= value && value > tresholds[0]) return "var(--color-yellow)"
  else if(value > tresholds[1]) return "var(--color-red)"
}
//#endregion


//#endregion

// Gamepad
setInterval(() => {
  // console.log(navigator.getGamepads())
  const gamepads = navigator.getGamepads()
  const playerNumberElement = document.getElementById("PlayerNumber")
  const ControllerScreenButtonsElement = document.getElementById("ControllerScreenButtons")
  let currentGamepad = null
  let controllerCount = 0
  let controllerChanged = false
  let controllerScreenOn = FindProperty(currentWindows, "screenId", "ControllerScreen") != undefined
  let statusScreenOn = FindProperty(currentWindows, "screenId", "StatusScreen") != undefined

  // player number
  for (let i = 0; i < gamepads.length; i++) {
    const gamepad = gamepads[i];
    if (gamepad != null) {
      controllerCount++

      if (controllerScreenOn) {
        playerNumberElement.textContent = "P" + (i + 1)
        playerNumberElement.style.color = "var(--color-green)"
      }

      currentGamepad = gamepad
      if (controllerId != gamepad.id) {
        controllerId = gamepad.id
        controllerChanged = true
      }
      else {
        controllerChanged = false
      }

    }
  }
  

  if (!controllerScreenOldState && controllerScreenOn) controllerChanged = true

  if (controllerScreenOn) {

    controllerScreenOldState = true
    if (controllerCount == 0) {
      playerNumberElement.textContent = "None"
      playerNumberElement.style.color = "var(--color-red)"
      playerNumberElement.title = "None"
      ControllerScreenButtonsElement.innerHTML = "<span>Buttons</span>"
      return
    }
    else if (controllerCount > 1) {
      playerNumberElement.textContent = "Multiple"
      playerNumberElement.style.color = "var(--color-yellow)"
    }

    // buttons
    if (controllerChanged) {
      ControllerScreenButtonsElement.innerHTML = "<span>Buttons</span>" 
    }

    for (let a = 0; a < currentGamepad.buttons.length; a++) {
      const button = currentGamepad.buttons[a];
      if (controllerChanged) {
        // create buttons
        ControllerScreenButtonsElement.innerHTML += `
          <div>
          <button id="controllerButton${a}" class="ButtonClass">${a}</button>
          <select id="controllerSelectBoxButton${a}" class='SelectBoxClass'>${buttonFunctionsString}</select>
          </div>
        `
        setTimeout(() => {
          document.getElementById("controllerSelectBoxButton" + a).value = GetControllerConfigFunction('button', a)
        }, 250);
      }


      const controllerButton = document.getElementById("controllerButton" + a)
      if (button.pressed) controllerButton.classList.add("ControlButtonActiveClass")
      else controllerButton.classList.remove("ControlButtonActiveClass")
      controllerButton.textContent = a + ": " + button.value.toFixed(4)
    }

    // axes
    if (controllerChanged) {
      ControllerScreenButtonsElement.innerHTML += "<span>Axes</span>"
    }

    for (let a = 0; a < currentGamepad.axes.length; a++) {
      const axis = currentGamepad.axes[a];
      if (controllerChanged) {
        // create buttons
        ControllerScreenButtonsElement.innerHTML += `
          <div>
          <button id="controllerAxis${a}" class="ButtonClass">${a}</button>
          <select id="controllerSelectBoxAxis${a}" class='SelectBoxClass'>"${buttonFunctionsString}</select>
          </div>
        `
        setTimeout(() => {
          document.getElementById("controllerSelectBoxAxis" + a).value = GetControllerConfigFunction('axis', a)
        }, 250);
      }
      const controllerAxis = document.getElementById("controllerAxis" + a)
      controllerAxis.textContent = a + ": " + axis.toFixed(4)
    }
  }
  else {
    controllerScreenOldState = false
  }

  let currentCommandStrings = []

  if (currentGamepad != null) {
    // Button Func
    for (let i = 0; i < currentGamepad.buttons.length; i++) {
      const button = currentGamepad.buttons[i];
      if (!button.pressed) continue

      const commandString = GetControllerConfigFunction("button", i) + "#" + button.value.toFixed(4)
      currentCommandStrings.push(commandString)
    }

    // Axis Func
    for (let i = 0; i < currentGamepad.axes.length; i++) {
      const axis = currentGamepad.axes[i];
      if (Math.abs(axis) < controllerDeadzone) continue

      const commandString = GetControllerConfigFunction("axis", i) + "#" + axis.toFixed(4)

      currentCommandStrings.push(commandString)
    }
  }
  else {
    // what to do if no controller
  }

  // console.log(currentCommandStrings);

  //send commmands
  if (isConnected) {
    if(targetLedColor != ""){
      currentCommandStrings.push("Led#" + targetLedColor)
      targetLedColor = ""
    }

    if(currentCommandStrings.length > 0) console.log(currentCommandStrings);
    

    socket.send(JSON.stringify({
      commands: currentCommandStrings,
      timestamp: Date.now()
    }));
  }

  if (statusScreenOn) {
    UpdateRoverStatus()
  }

  // console.log(currentGamepad);


}, 100);

