
const screens = [
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
          <div id="connection-status">Not connected</div>
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
]

let screenSelectBoxString = ""
CreateScreenSelectBoxString()


let windowId = 0;
const windowSizeIncrement = 10;
let currentWindows = []

document.getElementById('ip-address').value = document.location.host.split(':')[0]
document.addEventListener('DOMContentLoaded', function () {
  
  const container = document.getElementById('joystick-container');
  const colorpicker = document.getElementById('html5colorpicker');
  const armcom = document.getElementById('html5armcom');
  const motpar = document.getElementById('motorparam');
  const knob = document.getElementById('joystick-knob');
  const output = document.getElementById('output');
  const emergencyBtn = document.getElementById('emergency-btn');
  const connectBtn = document.getElementById('connect-btn');
  const connectionStatus = document.getElementById('connection-status');
  const ipAddressInput = document.getElementById('ip-address');
  const portInput = document.getElementById('port');
  const kolbox = document.getElementById('kolkontrol');
  let isEmergency = false;
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let socket = null;
  let isConnected = false;
  let sendInterval = null;
  let pingInterval = null;
  let scienceUp = 0
  let scienceDown = 0
  let scienceDrill = 0
  let arm1 = 0
  let arm2 = 0
  let arm3 = 0
  let arm4 = 0
  let armClockwise = 0
  let gripper = 0
  let gripperClockwise = 0
  const DEADZONE_THRESHOLD = 0.1;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Get container dimensions and center position
  let containerRect = container.getBoundingClientRect();
  let centerX = containerRect.width / 2;
  let centerY = containerRect.height / 2;

  // Maximum distance the joystick can move from center (radius - knob radius)
  let maxDistance = (containerRect.width / 2) - (knob.offsetWidth / 2);

  // Function to apply a deadzone
  function applyDeadzone(value, deadzone) {
    if (Math.abs(value) < deadzone) {
      return 0.0;
    }
    return value;
  }



  // Connect button functionality
  connectBtn.addEventListener('click', function () {
    if (isConnected) {
      disconnectFromBridge();
    } else {
      connectToBridge();
    }
  });

  connectBtn.addEventListener('input', function () {

  });

  // Function to connect to the bridge
  function connectToBridge() {
    const ipAddress = ipAddressInput.value;
    const port = portInput.value;
    reconnectAttempts = 0;

    try {
      // Create WebSocket connection
      connectionStatus.textContent = `Connecting to bridge at ${ipAddress}:${port}...`;

      // Use WebSocket protocol (ws:// or wss:// for secure)
      socket = new WebSocket(`ws://${ipAddress}:${port}`);

      // Connection opened
      socket.addEventListener('open', function (event) {
        isConnected = true;
        connectionStatus.textContent = `Connected to bridge at ${ipAddress}:${port}`;
        connectionStatus.classList.add('connected');
        connectBtn.textContent = 'DISCONNECT';
        connectBtn.classList.add('connected');

        // Start sending joystick data
        startSendingData();

        // Start ping interval to keep connection alive
        startPingInterval();
      });

      // Listen for messages from the server
      socket.addEventListener('message', function (event) {
        try {
          const response = JSON.parse(event.data);
          console.log('Message from bridge:', response);

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
      socket.addEventListener('close', function (event) {
        if (isConnected) {
          isConnected = false;
          connectionStatus.textContent = `Connection closed: ${event.reason || 'Unknown reason'}`;
          connectionStatus.classList.remove('connected');
          connectBtn.textContent = 'CONNECT';
          connectBtn.classList.remove('connected');

          if (sendInterval) {
            clearInterval(sendInterval);
            sendInterval = null;
          }

          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }

          // Try to reconnect if not manually disconnected
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            connectionStatus.textContent = `Connection lost. Reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`;
            setTimeout(connectToBridge, 2000); // Try to reconnect after 2 seconds
          }
        }
      });

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

  // Function to disconnect from the bridge
  function disconnectFromBridge() {
    if (sendInterval) {
      clearInterval(sendInterval);
      sendInterval = null;
    }

    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

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
    connectBtn.textContent = 'CONNECT';
    connectBtn.classList.remove('connected');
    reconnectAttempts = 0;
  }



  // Function to start ping interval to keep connection alive
  function startPingInterval() {
    if (pingInterval) {
      clearInterval(pingInterval);
    }

    pingInterval = setInterval(() => {
      if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
        // Send ping
        socket.send(JSON.stringify({
          command: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Ping every 30 seconds
  }

  // Function to start sending joystick data
  function startSendingData() {
    if (sendInterval) {
      clearInterval(sendInterval);
    }

    sendInterval = setInterval(() => {
      if (isConnected && !isEmergency && socket && socket.readyState === WebSocket.OPEN) {
        //game_pad=0;
        // Apply deadzone to joystick values

        let armco = armcom.value;
        if (kolbox["checked"] == true) {
          console.log(navigator.getGamepads())
          currentX = navigator.getGamepads()[0].axes[0]
          currentY = navigator.getGamepads()[0].axes[1]
          //scienceUp = navigator.getGamepads()[0].buttons[12].value
          //if (scienceUp){armco = 'i'}
          //scienceDown = navigator.getGamepads()[0].buttons[13].value
          //if (scienceDown){armco = 'k'}
          //scienceDrill = navigator.getGamepads()[0].buttons[14].value
          //if (scienceDrill){armco = 'o'}

          armClockwise = navigator.getGamepads()[0].buttons[5].value

          arm1 = navigator.getGamepads()[0].buttons[2].value
          if (arm1) { armco = 'c' }
          arm2 = navigator.getGamepads()[0].buttons[3].value
          if (arm2) { armco = 'v' }
          arm3 = navigator.getGamepads()[0].buttons[1].value
          if (arm3) { armco = 'b' }
          arm4 = navigator.getGamepads()[0].buttons[0].value
          if (arm4) { armco = 'n' }



          if (armClockwise) { armco = 'c' }
          gripperClockwise = navigator.getGamepads()[0].buttons[6].value
          if (gripperClockwise) { armco = 'j' }
          gripperCClockwise = navigator.getGamepads()[0].buttons[4].value
          if (gripperCClockwise) { armco = 'u' }
        }
        const linearVelocity = -1 * applyDeadzone(currentY, DEADZONE_THRESHOLD);
        const angularVelocity = -1 * applyDeadzone(currentX, DEADZONE_THRESHOLD) / 2;
        // Create data object to send
        const data = {
          linear: linearVelocity,
          angular: angularVelocity,
          arm_command: armco,
          rgb: colorpicker.value,
          motorparams: motpar.value,
          //dynaspeed: [navigator.getGamepads()[0].axes[2],navigator.getGamepads()[0].axes[5]],
          timestamp: Date.now()
        };
        colorpicker.value = ""


        // Send data as JSON
        socket.send(JSON.stringify(data));
        armcom.value = ""
      } else if (isEmergency && socket && socket.readyState === WebSocket.OPEN) {
        // Send emergency stop command
        socket.send(JSON.stringify({
          command: 'emergency_stop',
          timestamp: Date.now()
        }));
      }
    }, 100); // Send data every 100ms (10Hz)
  }

  // Emergency button functionality
  emergencyBtn.addEventListener('click', function () {
    isEmergency = !isEmergency;

    if (isEmergency) {
      container.classList.add('disabled');
      knob.classList.add('emergency');
      emergencyBtn.textContent = 'RESUME CONTROL';
      emergencyBtn.classList.add('active');
      resetJoystickPosition();

      // Send emergency stop command
      if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          command: 'emergency_stop',
          timestamp: Date.now()
        }));
        connectionStatus.textContent = 'Emergency stop command sent';
      }
    } else {
      container.classList.remove('disabled');
      knob.classList.remove('emergency');
      emergencyBtn.textContent = 'EMERGENCY STOP';
      emergencyBtn.classList.remove('active');

      // Send resume command
      if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          command: 'resume_control',
          timestamp: Date.now()
        }));
        connectionStatus.textContent = 'Control resumed';
      }
    }
  });

  // Function to update dimensions on resize
  function updateDimensions() {
    containerRect = container.getBoundingClientRect();
    centerX = containerRect.width / 2;
    centerY = containerRect.height / 2;
    maxDistance = (containerRect.width / 2) - (knob.offsetWidth / 2);
  }

  // Update dimensions on window resize
  window.addEventListener('resize', updateDimensions);

  // Function to update joystick position
  function updateJoystickPosition(clientX, clientY) {
    if (isEmergency) return;

    // Calculate position relative to container center
    const containerRect = container.getBoundingClientRect();
    let deltaX = clientX - containerRect.left - centerX;
    let deltaY = clientY - containerRect.top - centerY;

    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If distance is greater than max, normalize
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxDistance;
      deltaY = Math.sin(angle) * maxDistance;
    }

    // Update knob position
    knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

    // Calculate normalized values (-1 to 1)
    if (kolbox["checked"] == false) {
      currentX = parseFloat((deltaX / maxDistance).toFixed(2));
      currentY = parseFloat((-deltaY / maxDistance).toFixed(2)); // Invert Y axis to match the C++ code
    }
    // Update output display
    output.textContent = `X: ${currentX.toFixed(2)}, Y: ${currentY.toFixed(2)}`;
  }

  // Function to reset joystick position
  function resetJoystickPosition() {
    knob.style.transform = 'translate(-50%, -50%)';
    currentX = 0;
    currentY = 0;
    output.textContent = 'X: 0.00, Y: 0.00';
  }

  // Mouse event handlers
  container.addEventListener('mousedown', function (e) {
    if (isEmergency) return;
    isDragging = true;
    updateJoystickPosition(e.clientX, e.clientY);
  });

  document.addEventListener('mousemove', function (e) {
    if (isDragging && !isEmergency) {
      updateJoystickPosition(e.clientX, e.clientY);
    }
  });

  document.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false;
      resetJoystickPosition();
    }
  });

  // Touch event handlers
  container.addEventListener('touchstart', function (e) {
    if (isEmergency) return;
    isDragging = true;
    updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault(); // Prevent scrolling
  });

  document.addEventListener('touchmove', function (e) {
    if (isDragging && !isEmergency) {
      updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault(); // Prevent scrolling
    }
  });

  document.addEventListener('touchend', function () {
    if (isDragging) {
      isDragging = false;
      resetJoystickPosition();
    }
  });

  // Handle page visibility changes to prevent sending data when tab is not active
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && isDragging) {
      isDragging = false;
      resetJoystickPosition();
    }
  });

  // Handle page unload to clean up connection
  window.addEventListener('beforeunload', function () {
    if (isConnected && socket) {
      socket.close(1000, 'Page unloaded');
    }
  });

  // Initialize dimensions
  updateDimensions();
});


AddWindow()
SelectScreen("screenDiv1", "MobileScreen")

//#region Functions

// Windows and Screens
function AddWindow(){
  windowId++  
  document.getElementById("WindowsDiv").innerHTML += `
    <div style="width: 100%" id="window${windowId}" class="WindowClass">
      <div class="WindowTopClass">
        <select onchange="SelectScreen('screenDiv${windowId}', this.value)" name="" id="WindowCountSelectBox" class="SelectBox WindowSelectBox">
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
  currentWindows.push('window' + windowId)
}

function GetScreenHTML(id){
  for (let i = 0; i < screens.length; i++) {
    const screen = screens[i];
    if(screen.id == id) return screen.html
  }
}

function CreateScreenSelectBoxString(){
  for (let i = 0; i < screens.length; i++) {
    const screen = screens[i];
    screenSelectBoxString += `<option value="${screen.id}">${screen.id}</option>\n`
  }
}

function SelectScreen(screenDivId, screenId){
  document.getElementById(screenDivId).innerHTML = GetScreenHTML(screenId)
}

function ChangeWindowSize(id, size){
  const targetWindow =  document.getElementById(id)
  console.log(parseInt(targetWindow.style.width.slice(0, -1)) + windowSizeIncrement * size)
  targetWindow.style.width = (parseInt(targetWindow.style.width.slice(0, -1)) + windowSizeIncrement * size) + "%";
}

function CloseWindow(id){
  document.getElementById(id).remove();
  const index = currentWindows.indexOf(id)
  currentWindows.splice(index, 1)
}

function ChangeOrder(id, direction){
  if(currentWindows.length <= 1) return
  const index = currentWindows.indexOf(id)

  if(index == 0 && direction < 0) return
  else if(index == currentWindows.length - 1 & direction > 1) return

  currentWindows.splice(index, 1)
  currentWindows.splice(index + direction, 0, id)

  for (let i = 0; i < currentWindows.length; i++) {
    const window = document.getElementById(currentWindows[i]);
    window.style.order = i
  }
}
//#endregion


console.log(navigator.getGamepads())