// socketHandler.js
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Store active connections
  const activeConnections = new Map();

  // Socket.IO middleware for authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        socket.user = { guest: true };
        return next();
      }
      
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err) {
          socket.user = { guest: true };
        } else {
          socket.user = decoded;
        }
        next();
      });
    } catch (error) {
      socket.user = { guest: true };
      next();
    }
  });

  // Socket.IO Connection Handling
  io.on('connection', (socket) => {
    // Store socket with its ID
    activeConnections.set(socket.id, socket);
    
    // Send welcome message
    socket.emit('connected', { 
      message: 'Connected to chat server', 
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // Staff joins specific room
    socket.on('staff-join', (data) => {
      try {
        const staffId = typeof data === 'object' ? data.staffId : data;
        const staffName = typeof data === 'object' ? data.name : `Staff ${staffId}`;
        
        // Store staff info on socket
        socket.staffId = staffId;
        socket.userName = staffName;
        socket.userType = 'staff';
        
        // Join rooms - staff joins their personal room
        const staffRoom = `staff-${staffId}`;
        socket.join(staffRoom);
        socket.join('staff-room');
        
        // Notify staff
        socket.emit('staff-joined', { 
          staffId: staffId, 
          name: staffName,
          socketId: socket.id,
          message: 'You are now connected as staff',
          room: staffRoom
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join as staff' });
      }
    });

    // Patient joins specific room
    socket.on('patient-join', (data) => {
      try {
        let patientId = typeof data === 'object' ? data.patientId : data;
        const patientName = typeof data === 'object' ? data.name : `Patient ${patientId}`;
        
        // Ensure patientId is clean (just numbers)
        patientId = patientId.replace('patient-', '').trim();
        
        // Store patient info on socket
        socket.patientId = patientId;
        socket.userName = patientName;
        socket.userType = 'patient';
        
        // Join rooms - patient joins room with name "patient-[number]"
        const patientRoom = `patient-${patientId}`;
        socket.join(patientRoom);
        socket.join('patient-room');
        
        // Notify patient
        socket.emit('patient-joined', { 
          patientId: patientId, 
          name: patientName,
          socketId: socket.id,
          message: 'You are now connected as patient',
          room: patientRoom
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join as patient' });
      }
    });

    // Staff sends message to patient
    socket.on('staff-to-patient', (data) => {
      try {
        const { patientId, message, staffId, staffName } = data;
        
        // Validate data
        if (!patientId || !message) {
          return socket.emit('error', { 
            message: 'Missing required fields: patientId or message'
          });
        }
        
        // Clean patientId - accept both "001" and "patient-001"
        let cleanPatientId = patientId.toString().trim();
        cleanPatientId = cleanPatientId.replace('patient-', '');
        
        const timestamp = new Date().toISOString();
        const staffIdToUse = staffId || socket.staffId;
        const staffNameToUse = staffName || socket.userName || 'Staff';
        
        // Target room is always "patient-[number]"
        const targetRoom = `patient-${cleanPatientId}`;
        
        // Check if room exists
        const roomExists = io.sockets.adapter.rooms.has(targetRoom);
        
        if (roomExists) {
          // Send message to patient
          io.to(targetRoom).emit('message-from-staff', {
            staffId: staffIdToUse,
            staffName: staffNameToUse,
            message: message,
            timestamp: timestamp,
            type: 'text'
          });
          
          // Send confirmation to staff
          socket.emit('message-sent', {
            to: cleanPatientId,
            toName: 'Patient',
            message: message,
            status: 'delivered',
            timestamp: timestamp,
            room: targetRoom
          });
        } else {
          // List all patient rooms for debugging
          const allRooms = Array.from(io.sockets.adapter.rooms.keys());
          const patientRooms = allRooms.filter(room => 
            room.startsWith('patient-') && !io.sockets.adapter.sids.has(room)
          );
          
          socket.emit('error', {
            message: `Patient ${cleanPatientId} is not connected`,
            patientId: cleanPatientId,
            targetRoom: targetRoom,
            availablePatients: patientRooms.map(room => room.replace('patient-', ''))
          });
        }
      } catch (error) {
        socket.emit('error', { 
          message: 'Failed to send message: ' + error.message
        });
      }
    });

    // Patient sends message to staff
    socket.on('patient-to-staff', (data) => {
      try {
        const { staffId, message, patientId, patientName } = data;
        
        // Validate data
        if (!staffId || !message) {
          return socket.emit('error', { 
            message: 'Missing required fields: staffId or message'
          });
        }
        
        let cleanStaffId = staffId.toString().trim();
        cleanStaffId = cleanStaffId.replace('staff-', '');
        
        const timestamp = new Date().toISOString();
        const patientIdToUse = patientId || socket.patientId;
        const patientNameToUse = patientName || socket.userName || 'Patient';
        
        const targetRoom = `staff-${cleanStaffId}`;
        
        // Check if room exists
        const roomExists = io.sockets.adapter.rooms.has(targetRoom);
        
        if (roomExists) {
          // Send message to staff
          io.to(targetRoom).emit('message-from-patient', {
            patientId: patientIdToUse,
            patientName: patientNameToUse,
            message: message,
            timestamp: timestamp,
            type: 'text'
          });
          
          // Send confirmation to patient
          socket.emit('message-sent', {
            to: cleanStaffId,
            toName: 'Staff',
            message: message,
            status: 'delivered',
            timestamp: timestamp,
            room: targetRoom
          });
        } else {
          // List all staff rooms for debugging
          const allRooms = Array.from(io.sockets.adapter.rooms.keys());
          const staffRooms = allRooms.filter(room => 
            room.startsWith('staff-') && !io.sockets.adapter.sids.has(room)
          );
          
          socket.emit('error', {
            message: `Staff ${cleanStaffId} is not connected`,
            staffId: cleanStaffId,
            targetRoom: targetRoom,
            availableStaff: staffRooms.map(room => room.replace('staff-', ''))
          });
        }
      } catch (error) {
        socket.emit('error', { 
          message: 'Failed to send message: ' + error.message
        });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      try {
        const { target, isTyping, userId } = data;
        if (target) {
          io.to(target).emit('user-typing', {
            userId: userId || (socket.staffId || socket.patientId),
            userName: socket.userName,
            isTyping: isTyping,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.log(error);
      }
    });

    // Debug: Get all rooms
    socket.on('get-rooms', () => {
      const rooms = Array.from(io.sockets.adapter.rooms.entries())
        .filter(([roomName]) => !io.sockets.adapter.sids.has(roomName))
        .map(([roomName, sockets]) => ({
          name: roomName,
          clients: sockets.size
        }));
      
      socket.emit('rooms-list', {
        rooms: rooms,
        total: rooms.length,
        timestamp: new Date().toISOString()
      });
    });

    // Test ping
    socket.on('ping', () => {
      socket.emit('pong', {
        message: 'Server is alive',
        timestamp: new Date().toISOString(),
        yourSocketId: socket.id
      });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      // Remove from active connections
      activeConnections.delete(socket.id);
      
      // Notify relevant rooms
      if (socket.staffId) {
        socket.to('staff-room').emit('staff-offline', {
          staffId: socket.staffId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
      
      if (socket.patientId) {
        socket.to('patient-room').emit('patient-offline', {
          patientId: socket.patientId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  // Export helper functions if needed
  return {
    // Helper function to get all connections
    getActiveConnections: () => activeConnections,
    
    // Helper function to send message from server
    sendMessageToRoom: (room, event, data) => {
      io.to(room).emit(event, data);
    },
    
    // Helper function to get all rooms
    getAllRooms: () => {
      return Array.from(io.sockets.adapter.rooms.keys())
        .filter(roomName => !io.sockets.adapter.sids.has(roomName));
    }
  };
};
