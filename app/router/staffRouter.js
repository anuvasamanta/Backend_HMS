const express = require('express')
const route = express.Router();
const StaffController = require("../controllers/StaffController")
const verifyToken = require('../middleware/verifyRoleToken')
const StaffAuthCheck = require("../middleware/satffAuthCheck")

/**
 * @swagger
 * /staff/dashboard:
 *   get:
 *     summary: Get staff dashboard
 *     tags:
 *       - staff
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff dashboard retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/dashboard', verifyToken('staff'), StaffController.dashboard)

// attendence
/**
 * @swagger
 * /staff/checkin:
 *   post:
 *     summary: Checkin staff attendance
 *     tags:
 *       - staff
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff attendance checked in successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.post('/checkin', StaffAuthCheck, StaffController.checkIn)


/**
 * @swagger
 * /staff/checkout:
 *   post:
 *     summary: Checkout staff attendance
 *     tags:
 *       - staff
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff attendance checked out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.post('/checkout', StaffAuthCheck, StaffController.checkOut)

/**
 * @swagger
 * /staff/attendances:
 *   get:
 *     summary: Get staff attendance
 *     tags: 
 *       - staff
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff attendance retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/attendances',StaffAuthCheck, StaffController.getStaffAttendancePage)


// view all appointments
/**
 * @swagger
 * /staff/view/appointments:
 *   get:
 *     summary: Get doctor appointments
 *     tags: 
 *       - staff
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor appointments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/view/appointments', verifyToken('staff'),StaffController.viewAppointments)

/**
 * @swagger
 * /staff/doctor-feedback:
 *   get:
 *     summary: Get doctor feedbacks
 *     tags: 
 *       - staff
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor feedbacks retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/doctor-feedback',verifyToken('staff'),StaffController.doctorFeedbackList)

/**
 * @swagger
 * /staff/doctor-feedback/{doctorId}:
 *   get:
 *     summary: View individual doctor feedback.
 *     tags:
 *       - staff
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the doctor to view feedback
 *     responses:
 *       200:
 *         description:Feedback retrived successfully
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server Error
 */
route.get('/doctor-feedback/:doctorId',verifyToken('staff'),StaffController.viewDoctorFeedback)

// logout staff

/**
 * @swagger
 * /staff/logout:
 *   get:
 *     summary: Logout staff
 *     tags:
 *       - staff
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff logged out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/logout', verifyToken('staff'), StaffController.stafflogout)
module.exports = route