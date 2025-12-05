const express=require('express')
const route=express.Router()
const NurseController=require('../controllers/NurseController')
const NurseAuthCheck=require("../middleware/nurseAuthCheck")
const verifyToken=require('../middleware/verifyRoleToken')



/**
 * @swagger
 * /nurse/dashboard:
 *   get:
 *     summary: Get nurse dashboard
 *     tags:
 *       - nurse
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nurse dashboard retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/dashboard',verifyToken('nurse'),NurseController.dashboard)

/**
 * @swagger
 * /nurse/attendance:
 *   get:
 *     summary: Get nurse attendance
 *     tags: 
 *       - nurse
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nurse attendance retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/attendance',NurseAuthCheck,NurseController.getAttendancePage)

/**
 * @swagger
 * /nurse/checkin:
 *   post:
 *     summary: Checkin nurse attendance
 *     tags:
 *       - nurse
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nurse attendance checked in successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.post('/checkin',NurseAuthCheck,NurseController.checkIn)

/**
 * @swagger
 * /nurse/checkout:
 *   post:
 *     summary: Checkout nurse attendance
 *     tags:
 *       - nurse
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nurse attendance checked out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.post('/checkout',NurseAuthCheck,NurseController.checkOut)

/**
 * @swagger
 * /nurse/doctors-appointments:
 *   get:
 *     summary: Get nurse all doctors-appointments.
 *     tags:
 *       - nurse
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nurse retrieved doctors-appointments successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/doctor-appointments',verifyToken('nurse'),NurseController.appointment)

/**
 * @swagger
 * /nurse/logout:
 *   get:
 *     summary: Logout nurse
 *     tags:
 *       - nurse
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nurse logged out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/logout',verifyToken('nurse'),NurseController.nurselogout)
module.exports=route