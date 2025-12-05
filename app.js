// require('dotenv').config()
// const express = require('express')
// const http = require('http')
// const socketIo = require("socket.io")
// const cors = require('cors')
// const jwt = require('jsonwebtoken')
// const app = express()
// const server = http.createServer(app)
// const path = require('path')

// const DbConnection = require('./app/config/dbCon')
// DbConnection()

// const flash = require('connect-flash')
// const session = require('express-session')
// const cookieParser = require('cookie-parser');
// app.use(cookieParser());

// app.use(session({
//   secret: 'secrect',
//   cookie: { maxAge: 600000 },
//   resave: false,
//   saveUninitialized: false
// }))

// app.use(flash())
// app.use((req, res, next) => {
//   res.locals.success = req.flash("success");
//   res.locals.error = req.flash("error");
//   next();
// });

// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// app.use(express.json())
// app.use(express.urlencoded({ extended: true }));

// app.use('/uploads', express.static(path.join(__dirname, './uploads')))
// app.use(express.static(path.join(__dirname, 'public')))

// const swaggerJsDoc = require("swagger-jsdoc");
// const swaggerUi = require("swagger-ui-express");
// const SwaggerOptions = require("./swagger.json");
// const swaggerDocument = swaggerJsDoc(SwaggerOptions);

// // Allow all localhost origins for development
// const io = socketIo(server, {
//   cors: {
//     origin: (origin, callback) => {
//       if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
//         callback(null, true);
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     methods: ['GET', 'POST','PATCH'],
//     credentials: true,
//     transports: ['websocket', 'polling']
//   },
//   maxHttpBufferSize: 1e8,
//   pingTimeout: 60000
// });

// // CORS middleware
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   credentials: true
// }));

// // Make io accessible to routes
// app.set('socketio', io);

// const authMiddleWare = require('./app/middleware/auth')
// app.use(authMiddleWare)


// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// // Import routers

// const AuthRouter = require("./app/router/authRouter")
// app.use('/auth', AuthRouter)
// const EjsRouter = require("./app/router/ejsRouter")
// app.use(EjsRouter)
// const AdminRouter = require("./app/router/adminRouter")
// app.use('/admin', AdminRouter)
// const HospitalRouter = require('./app/router/hospitalRouter')
// app.use('/admin', HospitalRouter)
// const AttendanceRouter=require('./app/router/attendenceRouter')
// app.use(AttendanceRouter)
// const DoctorRouter=require('./app/router/doctorRouter')
// app.use('/doctor',DoctorRouter)
// const AppointmentRouter=require("./app/router/appointmentRouter")
// app.use('/api/appointments',AppointmentRouter)
// const UserRouter=require('./app/router/userRouter')
// app.use('/user',UserRouter)
// const StaffRouter=require('./app/router/staffRouter')
// app.use('/staff',StaffRouter)
// const NurseRouter=require('./app/router/nurseRouter')
// app.use('/nurse',NurseRouter)
// const chatRouter=require('./app/router/chatRouter')
// app.use(chatRouter)
// const FeedbackRouter=require('./app/router/feedbackRouter')
// app.use('/feedback',FeedbackRouter)


// // Store active connections
// const activeConnections = new Map();

// // Socket.IO middleware for authentication
// io.use((socket, next) => {
//   try {
//     const token = socket.handshake.auth.token;
    
//     if (!token) {
//       socket.user = { guest: true };
//       // console.log('Guest connection:', socket.id);
//       return next();
//     }
    
//     jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
//       if (err) {
//         // console.log('Socket auth failed:', err.message);
//         socket.user = { guest: true };
//       } else {
//         socket.user = decoded;
//         // console.log('Socket authenticated for user:', decoded.userId || decoded.id);
//       }
//       next();
//     });
//   } catch (error) {
//     // console.log('Socket middleware error:', error);
//     socket.user = { guest: true };
//     next();
//   }
// });

// // Socket.IO Connection Handling - FIXED VERSION
// io.on('connection', (socket) => {
//   // Store socket with its ID
//   activeConnections.set(socket.id, socket);
  
//   // Send welcome message
//   socket.emit('connected', { 
//     message: 'Connected to chat server', 
//     socketId: socket.id,
//     timestamp: new Date().toISOString()
//   });
  
//   // Staff joins specific room
//   socket.on('staff-join', (data) => {
//     try {
//       const staffId = typeof data === 'object' ? data.staffId : data;
//       const staffName = typeof data === 'object' ? data.name : `Staff ${staffId}`;
      
//       // Store staff info on socket
//       socket.staffId = staffId;
//       socket.userName = staffName;
//       socket.userType = 'staff';
      
//       // Join rooms - staff joins their personal room
//       const staffRoom = `staff-${staffId}`;
//       socket.join(staffRoom);
//       socket.join('staff-room');
      
//       // Notify staff
//       socket.emit('staff-joined', { 
//         staffId: staffId, 
//         name: staffName,
//         socketId: socket.id,
//         message: 'You are now connected as staff',
//         room: staffRoom
//       });
//     } catch (error) {
//       // console.error('Error in staff-join:', error);
//       socket.emit('error', { message: 'Failed to join as staff' });
//     }
//   });

//   // Patient joins specific room - SIMPLIFIED
//   socket.on('patient-join', (data) => {
//     try {
//       let patientId = typeof data === 'object' ? data.patientId : data;
//       const patientName = typeof data === 'object' ? data.name : `Patient ${patientId}`;
      
//       // Ensure patientId is clean (just numbers)
//       patientId = patientId.replace('patient-', '').trim();
      
//       // Store patient info on socket
//       socket.patientId = patientId;
//       socket.userName = patientName;
//       socket.userType = 'patient';
      
//       // Join rooms - patient joins room with name "patient-[number]"
//       const patientRoom = `patient-${patientId}`;
//       socket.join(patientRoom);
//       socket.join('patient-room');
      
//       // Notify patient
//       socket.emit('patient-joined', { 
//         patientId: patientId, 
//         name: patientName,
//         socketId: socket.id,
//         message: 'You are now connected as patient',
//         room: patientRoom
//       });
//     } catch (error) {
//       socket.emit('error', { message: 'Failed to join as patient' });
//     }
//   });

//   // Staff sends message to patient - WORKING VERSION
//   socket.on('staff-to-patient', (data) => {
//     try {
   
      
//       const { patientId, message, staffId, staffName } = data;
      
//       // Validate data
//       if (!patientId || !message) {
//         return socket.emit('error', { 
//           message: 'Missing required fields: patientId or message'
//         });
//       }
      
//       // Clean patientId - accept both "001" and "patient-001"
//       let cleanPatientId = patientId.toString().trim();
//       cleanPatientId = cleanPatientId.replace('patient-', '');
      
//       const timestamp = new Date().toISOString();
//       const staffIdToUse = staffId || socket.staffId;
//       const staffNameToUse = staffName || socket.userName || 'Staff';
      
//       // Target room is always "patient-[number]"
//       const targetRoom = `patient-${cleanPatientId}`;
    
      
//       // Check if room exists
//       const roomExists = io.sockets.adapter.rooms.has(targetRoom);
//       // console.log(`Room exists: ${roomExists}`);
      
//       if (roomExists) {
//         // Send message to patient
//         io.to(targetRoom).emit('message-from-staff', {
//           staffId: staffIdToUse,
//           staffName: staffNameToUse,
//           message: message,
//           timestamp: timestamp,
//           type: 'text'
//         });
        
//         // Send confirmation to staff
//         socket.emit('message-sent', {
//           to: cleanPatientId,
//           toName: 'Patient',
//           message: message,
//           status: 'delivered',
//           timestamp: timestamp,
//           room: targetRoom
//         });
//       } else {
       
//         // List all patient rooms for debugging
//         const allRooms = Array.from(io.sockets.adapter.rooms.keys());
//         const patientRooms = allRooms.filter(room => 
//           room.startsWith('patient-') && !io.sockets.adapter.sids.has(room)
//         );
        
//         socket.emit('error', {
//           message: `Patient ${cleanPatientId} is not connected`,
//           patientId: cleanPatientId,
//           targetRoom: targetRoom,
//           availablePatients: patientRooms.map(room => room.replace('patient-', ''))
//         });
//       }
//     } catch (error) {
//       // console.error('Error in staff-to-patient:', error);
//       socket.emit('error', { 
//         message: 'Failed to send message: ' + error.message
//       });
//     }
//   });

//   // Patient sends message to staff - WORKING VERSION
//   socket.on('patient-to-staff', (data) => {
//     try {
     
//       const { staffId, message, patientId, patientName } = data;
      
//       // Validate data
//       if (!staffId || !message) {
//         return socket.emit('error', { 
//           message: 'Missing required fields: staffId or message'
//         });
//       }
      
//       let cleanStaffId = staffId.toString().trim();
//       cleanStaffId = cleanStaffId.replace('staff-', '');
      
//       const timestamp = new Date().toISOString();
//       const patientIdToUse = patientId || socket.patientId;
//       const patientNameToUse = patientName || socket.userName || 'Patient';
      
//       const targetRoom = `staff-${cleanStaffId}`;
      
//       // Check if room exists
//       const roomExists = io.sockets.adapter.rooms.has(targetRoom);
     
      
//       if (roomExists) {
//         // Send message to staff
//         io.to(targetRoom).emit('message-from-patient', {
//           patientId: patientIdToUse,
//           patientName: patientNameToUse,
//           message: message,
//           timestamp: timestamp,
//           type: 'text'
//         });
        
//         // Send confirmation to patient
//         socket.emit('message-sent', {
//           to: cleanStaffId,
//           toName: 'Staff',
//           message: message,
//           status: 'delivered',
//           timestamp: timestamp,
//           room: targetRoom
//         });
//       } else {
//         // List all staff rooms for debugging
//         const allRooms = Array.from(io.sockets.adapter.rooms.keys());
//         const staffRooms = allRooms.filter(room => 
//           room.startsWith('staff-') && !io.sockets.adapter.sids.has(room)
//         );
        
//         socket.emit('error', {
//           message: `Staff ${cleanStaffId} is not connected`,
//           staffId: cleanStaffId,
//           targetRoom: targetRoom,
//           availableStaff: staffRooms.map(room => room.replace('staff-', ''))
//         });
//       }
//     } catch (error) {
    
//       socket.emit('error', { 
//         message: 'Failed to send message: ' + error.message
//       });
//     }
//   });

//   // Typing indicator
//   socket.on('typing', (data) => {
//     try {
//       const { target, isTyping, userId } = data;
//       if (target) {
//         io.to(target).emit('user-typing', {
//           userId: userId || (socket.staffId || socket.patientId),
//           userName: socket.userName,
//           isTyping: isTyping,
//           timestamp: new Date().toISOString()
//         });
//       }
//     } catch (error) {
//      console.log(error);
//     }
//   });

//   // Debug: Get all rooms
//   socket.on('get-rooms', () => {
//     const rooms = Array.from(io.sockets.adapter.rooms.entries())
//       .filter(([roomName]) => !io.sockets.adapter.sids.has(roomName))
//       .map(([roomName, sockets]) => ({
//         name: roomName,
//         clients: sockets.size
//       }));
    
//     socket.emit('rooms-list', {
//       rooms: rooms,
//       total: rooms.length,
//       timestamp: new Date().toISOString()
//     });
//   });

//   // Test ping
//   socket.on('ping', () => {
//     socket.emit('pong', {
//       message: 'Server is alive',
//       timestamp: new Date().toISOString(),
//       yourSocketId: socket.id
//     });
//   });

//   // Disconnect handler
//   socket.on('disconnect', (reason) => {
   
//     // Remove from active connections
//     activeConnections.delete(socket.id);
    
//     // Notify relevant rooms
//     if (socket.staffId) {
//       socket.to('staff-room').emit('staff-offline', {
//         staffId: socket.staffId,
//         socketId: socket.id,
//         timestamp: new Date().toISOString()
//       });
//     }
    
//     if (socket.patientId) {
//       socket.to('patient-room').emit('patient-offline', {
//         patientId: socket.patientId,
//         socketId: socket.id,
//         timestamp: new Date().toISOString()
//       });
//     }
//   });
// });





// const PORT = process.env.PORT || 8400;
// server.listen(PORT, () => {
//   console.log(` Server is running on http://localhost:${PORT}`);
// });


require('dotenv').config()
const express = require('express')
const http = require('http')
const socketIo = require("socket.io")
const cors = require('cors')
const app = express()
const server = http.createServer(app)
const path = require('path')

const DbConnection = require('./app/config/dbCon')
DbConnection()

const flash = require('connect-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(session({
  secret: 'secrect',
  cookie: { maxAge: 600000 },
  resave: false,
  saveUninitialized: false
}))

app.use(flash())
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, './uploads')))
app.use(express.static(path.join(__dirname, 'public')))

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const SwaggerOptions = require("./swagger.json");
const swaggerDocument = swaggerJsDoc(SwaggerOptions);

// Allow all localhost origins for development
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST','PATCH'],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000
});

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Make io accessible to routes
app.set('socketio', io);

const authMiddleWare = require('./app/middleware/auth')
app.use(authMiddleWare)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Import routers
const AuthRouter = require("./app/router/authRouter")
app.use('/auth', AuthRouter)
const EjsRouter = require("./app/router/ejsRouter")
app.use(EjsRouter)
const AdminRouter = require("./app/router/adminRouter")
app.use('/admin', AdminRouter)
const HospitalRouter = require('./app/router/hospitalRouter')
app.use('/admin', HospitalRouter)
const AttendanceRouter=require('./app/router/attendenceRouter')
app.use(AttendanceRouter)
const DoctorRouter=require('./app/router/doctorRouter')
app.use('/doctor',DoctorRouter)
const AppointmentRouter=require("./app/router/appointmentRouter")
app.use('/api/appointments',AppointmentRouter)
const UserRouter=require('./app/router/userRouter')
app.use('/user',UserRouter)
const StaffRouter=require('./app/router/staffRouter')
app.use('/staff',StaffRouter)
const NurseRouter=require('./app/router/nurseRouter')
app.use('/nurse',NurseRouter)
const chatRouter=require('./app/router/chatRouter')
app.use(chatRouter)
const FeedbackRouter=require('./app/router/feedbackRouter')
app.use('/feedback',FeedbackRouter)

// Import and initialize socket handler
const initSocket = require('./app/socket/socket');
const socketHandler = initSocket(io);

// Make socketHandler available to routes if needed
app.set('socketHandler', socketHandler);

const PORT = process.env.PORT || 8400;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});