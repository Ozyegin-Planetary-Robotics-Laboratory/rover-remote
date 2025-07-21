	document.getElementById('ip-address').value = document.location.host.split(':')[0]
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('joystick-container');
            const colorpicker = document.getElementById('html5colorpicker');
            const knob = document.getElementById('joystick-knob');
            const output = document.getElementById('output');
            const emergencyBtn = document.getElementById('emergency-btn');
            const connectBtn = document.getElementById('connect-btn');
            const connectionStatus = document.getElementById('connection-status');
            const ipAddressInput = document.getElementById('ip-address');
            const portInput = document.getElementById('port');

            let isEmergency = false;
            let isDragging = false;
            let currentX = 0;
            let currentY = 0;
            let socket = null;
            let isConnected = false;
            let sendInterval = null;
            let pingInterval = null;
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
            connectBtn.addEventListener('click', function() {
                if (isConnected) {
                    disconnectFromBridge();
                } else {
                    connectToBridge();
                }
            });

            connectBtn.addEventListener('input', function() {
                
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
                    socket.addEventListener('open', function(event) {
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
                    socket.addEventListener('message', function(event) {
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
                    socket.addEventListener('close', function(event) {
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
                    socket.addEventListener('error', function(error) {
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

                        // Apply deadzone to joystick values
			//currentX = navigator.getGamepads()[0].axes[0]
                        //currentY = -1*navigator.getGamepads()[0].axes[1]
                        const linearVelocity = applyDeadzone(currentY, DEADZONE_THRESHOLD);
                        const angularVelocity = applyDeadzone(currentX, DEADZONE_THRESHOLD);

                        // Create data object to send
                        const data = {
                            linear: linearVelocity,
                            angular: angularVelocity,
                            rgb: colorpicker.value,
                            timestamp: Date.now()
                        };
			console.log(data)
                        // Send data as JSON
                        socket.send(JSON.stringify(data));
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
            emergencyBtn.addEventListener('click', function() {
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
                currentX = parseFloat((deltaX / maxDistance).toFixed(2));
                currentY = parseFloat((-deltaY / maxDistance).toFixed(2)); // Invert Y axis to match the C++ code

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
            container.addEventListener('mousedown', function(e) {
                if (isEmergency) return;
                isDragging = true;
                updateJoystickPosition(e.clientX, e.clientY);
            });

            document.addEventListener('mousemove', function(e) {
                if (isDragging && !isEmergency) {
                    updateJoystickPosition(e.clientX, e.clientY);
                }
            });

            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    resetJoystickPosition();
                }
            });

            // Touch event handlers
            container.addEventListener('touchstart', function(e) {
                if (isEmergency) return;
                isDragging = true;
                updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault(); // Prevent scrolling
            });

            document.addEventListener('touchmove', function(e) {
                if (isDragging && !isEmergency) {
                    updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
                    e.preventDefault(); // Prevent scrolling
                }
            });

            document.addEventListener('touchend', function() {
                if (isDragging) {
                    isDragging = false;
                    resetJoystickPosition();
                }
            });

            // Handle page visibility changes to prevent sending data when tab is not active
            document.addEventListener('visibilitychange', function() {
                if (document.hidden && isDragging) {
                    isDragging = false;
                    resetJoystickPosition();
                }
            });

            // Handle page unload to clean up connection
            window.addEventListener('beforeunload', function() {
                if (isConnected && socket) {
                    socket.close(1000, 'Page unloaded');
                }
            });

            // Initialize dimensions
            updateDimensions();
        });
