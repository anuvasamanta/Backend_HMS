const express = require('express');
const route = express.Router();
const DoctorController = require('../controllers/DoctorController');
const AttendanceController = require('../controllers/AttendenceController')
const doctorAuthCheck = require('../middleware/doctorAuthCheck');
const upload = require('../config/multerConfig');

const handleUpload = (req, res, next) => {
    upload.single('profile')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
        next();
    });
};
const handleFile = (req, res, next) => {
    upload.single('fileUrl')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
        next();
    });
};


// Dashboard
/**
 * @swagger
 * /doctor/dashboard:
 *   get:
 *     summary: Get doctor dashboard
 *     tags:
 *       - doctor
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor dashboard retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/dashboard', doctorAuthCheck, DoctorController.dashboard);


// logout
/**
 * @swagger
 * /doctor/logout:
 *   get:
 *     summary: Logout doctor
 *     tags:
 *       - doctor
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor logged out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/logout', DoctorController.doctorlogout)


// Create profile
/**
 * @swagger
 * /doctor/doctor-profile:
 *   post:
 *     summary: Create doctor profile
 *     description: Doctor can create their own profile from their dashboard.
 *     tags:
 *       - doctor
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: qualification
 *         type: string
 *         required: true
 *         description: The qualification of the doctor.
 *       - in: formData
 *         name: experience
 *         type: string
 *         required: true
 *         description: The experience of the doctor.
 *       - in: formData
 *         name: timing
 *         type: string
 *         required: true
 *         description: The timing of the doctor.
 *       - in: formData
 *         name: profile
 *         type: file
 *         required: true
 *         description: A profile image of the doctor.
 *       - in: formData
 *         name: language
 *         type: string
 *         required: true
 *         description: The language of the doctor.
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile created successfully"
 *                 userId:
 *                   type: string
 *                   example: "60d75b1f5b1f5673e4032c5c"
 *       400:
 *         description: Bad request. Missing or invalid parameters.
 *       401:
 *         description: Unauthorized. Invalid or expired token.
 *       500:
 *         description: Internal server error. Something went wrong on the server side.
 */
route.post('/doctor-profile', doctorAuthCheck, handleUpload, DoctorController.doctorProfile);


// View profile
/**
 * @swagger
 * /doctor/profile:
 *   get:
 *     summary: Get doctor profile
 *     tags: 
 *       - doctor
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/profile', doctorAuthCheck, DoctorController.getProfile);


// attendence
/**
 * @swagger
 * /doctor/checkin:
 *   post:
 *     summary: Checkin doctor attendance
 *     tags:
 *       - doctor
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor attendance checked in successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.post('/checkin', doctorAuthCheck, AttendanceController.checkIn)


/**
 * @swagger
 * /doctor/checkout:
 *   post:
 *     summary: Checkout doctor attendance
 *     tags:
 *       - doctor
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor attendance checked out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.post('/checkout', doctorAuthCheck, AttendanceController.checkOut)



/**
 * @swagger
 * /doctor/attendance:
 *   get:
 *     summary: Get doctor attendance
 *     tags: 
 *       - doctor
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor attendance retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/attendance', doctorAuthCheck, AttendanceController.getAttendancePage)

/**
 * @swagger
 * /doctor/feedback:
 *   get:
 *     summary: Get doctor feedback.
 *     tags:
 *       - doctor
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctors get feedback retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/feedback',doctorAuthCheck,DoctorController.getDoctorFeedbackPage)

route.post('/appointment/:appointmentId',doctorAuthCheck,handleFile,DoctorController.createprescription)


// Your current route (using :appointmentId)
route.get('/prescription/:appointmentId', doctorAuthCheck, DoctorController.prescription);


// doctor view on frontend
/**
 * @swagger
 * /doctor/group-location:
 *   get:
 *     summary: Get doctors grouped by hospital location
 *     tags:
 *       - home
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctors grouped by hospital location retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/group-location', DoctorController.getDoctorsGroupedByHospital)


route.get("/user/doctor/search", DoctorController.searchDoctors);


/**
 * @swagger
 * /doctor/group-department:
 *   get:
 *     summary: Get doctors grouped by department
 *     tags:
 *       - home
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctors grouped by department retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/group-department', DoctorController.getDoctorsGroupedByDepartment)

module.exports = route;

