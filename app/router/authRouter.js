const express = require('express')
const route = express.Router()
const AuthController = require("../controllers/AuthController")
const verifyToken=require('../middleware/verifyRoleToken')

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User Registration
 *     tags:
 *       - auth
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: Add User
 *         description: Add User in MongoDB.
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - email
 *             - phone
 *             - password
 *             - location
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *             password:
 *               type: string
 *             location:
 *               type: string
 *     responses:
 *       200:
 *         description: User register successfully!
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */
route.post('/register', AuthController.register)

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify user email using OTP
 *     tags:
 *       - auth
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: VerifyUser
 *         description: Verify user email with OTP.
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - otp
 *           properties:
 *             email:
 *               type: string
 *               example: johndoe@example.com
 *             otp:
 *               type: string
 *               example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: boolean
 *               example: true
 *             message:
 *               type: string
 *               example: Email verified successfully
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: User not found or OTP expired
 *       500:
 *         description: Internal server error
 */
route.post('/verify', AuthController.verify)

/**
 * @swagger
 * /auth/login:
 *  post:
 *    summary: Patient Login
 *    tags:
 *      - auth
 *    produces:
 *      - application/json
 *    parameters:
 *      - in: body
 *        name: Patient Login
 *        description: Patient Login in MongoDB.
 *        schema:
 *          type: object
 *          required:
 *            - email
 *            - password
 *          properties:
 *            email:
 *              type: string
 *            password:
 *              type: string
 *    responses:
 *      200:
 *        description: User logged in successfully
 *      400:
 *        description: Bad Request
 *      401:
 *        description: Unauthorized
 *      500:
 *        description: Server Error
 */
route.post('/login', AuthController.patientLogin)

/**
 * @swagger
 * /auth/staff/login:
 *  post:
 *    summary: Staff Login (Doctor, Nurse, Pharmacist, etc.)
 *    tags:
 *      - auth
 *    produces:
 *      - application/json
 *    parameters:
 *      - in: body
 *        name: Staff Login
 *        description: Staff Login in MongoDB.
 *        schema:
 *          type: object
 *          required:
 *            - email
 *            - password
 *          properties:
 *            email:
 *              type: string
 *            password:
 *              type: string
 *    responses:
 *      200:
 *        description: Staff logged in successfully
 *      400:
 *        description: Bad Request
 *      401:
 *        description: Unauthorized
 *      500:
 *        description: Server Error
 */
route.post('/staff/login', AuthController.staffLogin)

// Patient profile

/**
 * @swagger
 * /auth/patient/profile:
 *   get:
 *     summary: Get patient profile
 *     tags:
 *       - auth
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get("/patient/profile", verifyToken("patient"), AuthController.getProfile);

// Doctor profile
/**
 * @swagger
 * /auth/doctor/profile:
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
route.get("/doctor/profile", verifyToken("doctor"), AuthController.getProfile);

// Nurse profile
/**
 * @swagger
 * /auth/nurse/profile:
 *   get:
 *     summary: Get nurse profile
 *     tags:
 *       - auth
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nurse profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get("/nurse/profile", verifyToken("nurse"), AuthController.getProfile);

// Staff profile
/**
 * @swagger
 * /auth/staff/profile:
 *   get:
 *     summary: Get staff profile
 *     tags:
 *       - auth
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get("/staff/profile", verifyToken("staff"), AuthController.getProfile);

// Admin profile

/**
 * @swagger
 * /auth/admin/profile:
 *   get:
 *     summary: Get admin profile
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get("/admin/profile", verifyToken("admin"), AuthController.getProfile);


// API
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset link
 *     tags:
 *       - auth
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: email
 *         description: Email address to send password reset link
 *         schema:
 *           type: object
 *           required:
 *             - email
 *           properties:
 *             email:
 *               type: string
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */
route.post("/forgot-password", AuthController.resetPasswordLink);

/**
 * @swagger
 * /auth/reset-password/{id}/{token}:
 *   post:
 *     summary: Reset password
 *     tags:
 *       - auth
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         description: User ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         description: Password reset token
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: password
 *         description: New password
 *         schema:
 *           type: object
 *           required:
 *             - password
 *           properties:
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.post("/reset-password/:id/:token", AuthController.resetPassword);


// EJS PAGES
route.get("/forgot-password",AuthController.forgotPasswordPage);
route.get("/reset-password/:id/:token", AuthController.resetPasswordPage);

module.exports = route